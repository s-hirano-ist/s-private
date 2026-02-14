# Issue: MinIO から ConoHa Object Storage (OpenStack Swift) への移行

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Infrastructure / Storage |
| **Priority** | HIGH |
| **Check Item** | オブジェクトストレージを MinIO から ConoHa Object Storage (Swift API) に移行 |
| **Affected File** | `app/src/minio.ts`, `app/src/infrastructures/shared/storage/`, `app/src/env.ts`, `app/src/common/error/error-wrapper.ts`, `app/next.config.mjs`, `app/Dockerfile`, `packages/scripts/src/`, `.github/workflows/` |

## Problem Description

現在 MinIO をオブジェクトストレージとして使用しているが、コスト削減およびデータローカリティ（日本国内データセンター: `tyo1`, `tyo2`）の観点から、ConoHa Object Storage への移行を行う。

### 前提調査

- **ConoHa Object Storage は OpenStack Swift ベース**であり、S3 API をネイティブ提供しない
- ConoHa の「S3 API互換」は **S3Proxy（Java製プロキシ）をセルフホスト**する方式であり、運用コストが増す
- **Swift REST API を直接利用**する方針を採用（`fetch` ベースのゼロ依存実装）

### 現状の MinIO 使用状況

使用しているオペレーションは4種のみ:

| オペレーション | 用途 |
|--------------|------|
| `putObject()` | アップロード |
| `getObject()` | ダウンロード（ストリーム） |
| `statObject()` | 存在チェック |
| `removeObject()` | 削除 |

※ `ListObjectsV2` は未使用（ConoHa S3 API の制限に該当しないため好都合）

### 現在のインターフェース

```typescript
// packages/core/shared-kernel/services/storage-service.interface.ts
export type IStorageService = {
  uploadImage(path: string, buffer: Buffer, isThumbnail: boolean): Promise<void>;
  getImage(path: string, isThumbnail: boolean): Promise<NodeJS.ReadableStream>;
  getImageOrThrow(path: string, isThumbnail: boolean): Promise<void>;
  deleteImage(path: string, isThumbnail: boolean): Promise<void>;
};
```

Clean Architecture + DDD により、ドメイン層・アプリケーション層は import パス変更のみ。実質的な変更はインフラ層に集中する。

## Recommendation

### SDK/ライブラリ選定: Native `fetch` による直接実装

| 候補 | 判定 | 理由 |
|------|------|------|
| `pkgcloud` | 却下 | 巨大な依存、過度な抽象化、メジャー更新が数年前 |
| `openstack-swift-client` (npm) | 却下 | 最終公開4年前、脆弱性1件、事実上放棄 |
| `node-swiftclient` (dcbeck) | 却下 | Star 0、コミット26、本番実績なし |
| **Native `fetch`** | **採用** | **ゼロ依存、完全な制御、テスト容易、Node.js 24 で native fetch 利用可** |

Swift REST API は HTTP verb + `X-Auth-Token` ヘッダーのシンプルな構成であり、外部ライブラリ不要。

### オペレーションマッピング

| 現行 (MinIO) | 移行先 (Swift) |
|--------------|----------------|
| `putObject()` | `PUT /v1/{account}/{container}/{object}` |
| `getObject()` | `GET /v1/{account}/{container}/{object}` |
| `statObject()` | `HEAD /v1/{account}/{container}/{object}` |
| `removeObject()` | `DELETE /v1/{account}/{container}/{object}` |
| `fGetObject()` | `GET` + `fs.writeFile` |

### アーキテクチャ設計

```
app/src/swift-client.ts                    -- Swift client singleton（minio.ts を置換）
  |
  +-- SwiftAuthManager                     -- Keystone v2 認証 + トークンキャッシュ/リフレッシュ
  +-- SwiftObjectClient                    -- HTTP オペレーション: put, get, head, delete
  |
app/src/infrastructures/shared/storage/
  +-- swift-storage-service.ts             -- IStorageService 実装（images用）
  +-- books-storage-service.ts             -- Swift client を使用するよう更新
  +-- swift-storage-service.test.ts        -- ユニットテスト
```

### 認証: Keystone v2

ConoHa は `https://identity.tyo1.conoha.io/v2.0` で Keystone v2.0 認証を使用。

```typescript
// SwiftAuthManager 概念設計
type SwiftToken = {
  token: string;
  expiresAt: Date;
  objectStoreUrl: string; // e.g., "https://objectstore-r1nd1001.cnode.jp/v1/nc_{TENANT_ID}"
};

class SwiftAuthManager {
  private cachedToken: SwiftToken | null = null;

  async getToken(): Promise<SwiftToken> {
    // 有効期限5分前バッファでキャッシュトークンを返却
    if (this.cachedToken && this.cachedToken.expiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
      return this.cachedToken;
    }
    // POST /v2.0/tokens で再取得
    // - token: data.access.token.id
    // - expiry: data.access.token.expires
    // - objectStoreUrl: data.access.serviceCatalog (type: "object-store")
  }
}
```

### エラーハンドリング

`Minio.S3Error` をカスタムエラー型で置換:

```typescript
export class SwiftStorageError extends Error {
  constructor(
    public readonly method: string,
    public readonly statusCode: number,
    public readonly objectPath: string,
  ) { /* ... */ }
}

export class SwiftAuthError extends Error {
  constructor(message: string) { /* ... */ }
}
```

### 環境変数の変更

**削除 (5変数):**
```
MINIO_HOST
MINIO_PORT
MINIO_BUCKET_NAME
MINIO_ACCESS_KEY
MINIO_SECRET_KEY
```

**追加 (5変数):**
```
SWIFT_AUTH_URL          # e.g., "https://identity.tyo1.conoha.io/v2.0"
SWIFT_TENANT_NAME       # ConoHa テナント名（API情報パネルから取得）
SWIFT_USERNAME          # ConoHa API ユーザー名
SWIFT_PASSWORD          # ConoHa API パスワード
SWIFT_CONTAINER_NAME    # コンテナ名（MinIO バケット相当）
```

Object Storage エンドポイント URL は Keystone 認証レスポンスの `serviceCatalog` から動的に取得するため、別途変数は不要。

## 変更対象ファイル一覧（約20ファイル）

### コアインフラ（app層）
- `app/src/minio.ts` → `app/src/swift-client.ts` に置換
- `app/src/infrastructures/shared/storage/minio-storage-service.ts` → `swift-storage-service.ts` に置換
- `app/src/infrastructures/shared/storage/books-storage-service.ts` — import 更新
- `app/src/env.ts` — 環境変数入れ替え

### アプリケーションサービス
- `app/src/application-services/images/add-image.deps.ts` — `minioStorageService` → `swiftStorageService`
- `app/src/application-services/images/get-images.ts` — 同上
- `app/src/application-services/books/add-books.deps.ts` — `booksStorageService` 経由（間接影響）
- `app/src/application-services/books/get-books.ts` — 同上

### エラーハンドリング
- `app/src/common/error/error-wrapper.ts` — `Minio.S3Error` → `SwiftStorageError`
- `app/src/common/error/error-wrapper.test.ts` — テスト更新

### 設定・ビルド
- `app/next.config.mjs` — MinIO CSP エントリ削除、`images.remotePatterns` 削除
- `app/Dockerfile` — MINIO_* シークレットを SWIFT_* に置換
- `app/.env.sample` — テンプレート更新
- `app/package.json` — `minio` 依存削除

### スクリプト
- `packages/scripts/src/ingest-images.ts` — MinIO client 置換
- `packages/scripts/src/fetch-images.ts` — `fGetObject` → fetch + writeFile
- `packages/scripts/src/fetch-books.ts` — 同上
- `packages/scripts/package.json` — `minio` 依存削除

### テスト
- `app/src/infrastructures/shared/storage/minio-storage-service.test.ts` → Swift テストに置換
- `app/vitest-setup.tsx` — `@/minio` モックを `@/swift-client` モックに置換

### CI/CD
- `.github/workflows/cd.yaml` — MINIO_* シークレットを SWIFT_* に置換
- `.github/workflows/ci.yaml` — 同上

## Implementation Steps

### Phase 1: 基盤構築
1. [ ] `app/src/swift-client.ts` 作成（SwiftAuthManager + SwiftObjectClient）
2. [ ] カスタムエラークラス作成（SwiftStorageError, SwiftAuthError）
3. [ ] `swift-storage-service.ts` 作成（IStorageService 実装）

### Phase 2: 配線変更
4. [ ] `app/src/env.ts` の環境変数入れ替え
5. [ ] アプリケーションサービスの import パス更新
6. [ ] `error-wrapper.ts` のエラー型更新
7. [ ] `next.config.mjs` の MinIO 関連設定削除
8. [ ] `books-storage-service.ts` の Swift client 対応

### Phase 3: スクリプト更新
9. [ ] `ingest-images.ts` の Swift 対応
10. [ ] `fetch-images.ts` の Swift 対応
11. [ ] `fetch-books.ts` の Swift 対応

### Phase 4: テスト
12. [ ] `swift-storage-service.test.ts` 作成
13. [ ] `error-wrapper.test.ts` 更新
14. [ ] `vitest-setup.tsx` モック更新

### Phase 5: ビルド・CI/CD
15. [ ] `.env.sample` 更新
16. [ ] `Dockerfile` のシークレット更新
17. [ ] `.github/workflows/cd.yaml` 更新
18. [ ] `.github/workflows/ci.yaml` 更新

### Phase 6: クリーンアップ
19. [ ] `app/src/minio.ts` 削除
20. [ ] `minio-storage-service.ts` 削除
21. [ ] `minio-storage-service.test.ts` 削除
22. [ ] `minio` パッケージを `app/package.json` および `packages/scripts/package.json` から削除

## データ移行戦略

### Option A（推奨）: 事前移行

1. ワンタイム移行スクリプトを作成
2. MinIO から全オブジェクトを読み出し、同一パスで ConoHa Swift にアップロード
3. HEAD リクエストで検証
4. コード変更をデプロイ
5. MinIO を廃止

パス構造は同一を維持: `images/original/{path}`, `images/thumbnail/{path}`, `books/original/{path}`, `books/thumbnail/{path}`

### Option B: デュアルライト期間（高トラフィック向け、より複雑）

## リスクと注意事項

| リスク | 対策 |
|--------|------|
| トークン期限切れ（通常24時間） | 有効期限5分前バッファでリフレッシュ |
| Swift コンテナ未作成 | ConoHa コントロールパネルまたはプログラムで事前作成 |
| CSP への影響 | 画像は API ルート経由で配信されるため、MinIO CSP エントリは安全に削除可能 |
| ストリーム変換 | `fetch` は Web `ReadableStream` を返すため、Node.js Stream への変換が不要になる最適化機会あり |
| ネットワークレイテンシ | ConoHa 日本エンドポイントにより日本ユーザーへのレイテンシ改善 |

## 検証計画

1. `pnpm test` — 全テスト通過
2. `pnpm build` — ビルドエラーなし
3. `pnpm lint:fix && pnpm check:fix` — lint/format 通過
4. ConoHa に対するローカルテスト: 画像のアップロード・表示・削除
5. スクリプトテスト: `ingest-images`, `fetch-images`, `fetch-books`

## References

- [ConoHa Object Storage API](https://www.conoha.jp/docs/swift-api.php)
- [OpenStack Swift API v1](https://docs.openstack.org/api-ref/object-store/)
- [Keystone v2.0 Authentication](https://docs.openstack.org/keystone/latest/)
