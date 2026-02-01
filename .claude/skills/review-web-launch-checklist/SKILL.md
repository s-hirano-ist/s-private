---
name: review-web-launch-checklist
description: Webサービス公開前のチェックリストをベースにプロジェクトをレビューし、改善候補をissue化する。
globs:
  - "app/src/**/*"
  - "packages/**/*"
---

# Review Web Launch Checklist Skill

Zenn記事「[Webサービス公開前のチェックリスト](https://zenn.dev/catnose99/articles/547cbf57e5ad28)」をベースに、プロジェクトをレビューし、改善候補をissue化する。

## ワークフロー

### 1. プロジェクト確認
- プロジェクトの構成を把握
- 使用している技術スタック（Auth0、NextAuth.js、Prisma等）を確認
- 既存の`issues/`ディレクトリを確認し重複を避ける

### 2. チェック実行
以下のカテゴリについて順にチェック:

#### チェックカテゴリ（優先度順）

##### 1. セキュリティ (CRITICAL/HIGH)

| Priority | Check Item | Description |
|----------|------------|-------------|
| CRITICAL | 認証Cookie設定 | HttpOnly、SameSite、Secure、Domain属性が適切に設定されているか |
| CRITICAL | ユーザー入力バリデーション | クライアント・サーバー両方でバリデーションしているか |
| CRITICAL | URLバリデーション | オープンリダイレクト脆弱性がないか |
| CRITICAL | HTMLエスケープ | XSS対策が適切に行われているか |
| CRITICAL | SQLインジェクション対策 | Prisma等ORMの適切な使用、生SQLの回避 |
| HIGH | レスポンスヘッダ | HSTS、X-Frame-Options、X-Content-Type-Optionsが設定されているか |
| HIGH | ユーザーハンドルネーム検証 | リザーブド文字列（admin, api等）のチェック |
| HIGH | 重要操作での再認証 | パスワード変更、退会等で再認証を求めているか |
| HIGH | キャッシュ制御 | 機密データを含むレスポンスにno-storeが設定されているか |
| HIGH | ファイルアップロード検証 | ファイルタイプ、サイズ、内容の検証 |
| HIGH | DB・ストレージバックアップ | 自動バックアップが設定されているか |
| MEDIUM | 二要素認証 | 2FAオプションが提供されているか |

##### 2. メール・認証 (HIGH/MEDIUM)

| Priority | Check Item | Description |
|----------|------------|-------------|
| HIGH | メール本人確認 | 登録時にメールアドレスの確認を行っているか |
| HIGH | メールアドレス列挙防止 | ログイン/登録時に存在有無を漏らさないか |
| MEDIUM | 複数ログイン方法の統一 | ソーシャルログイン等の仕様が統一されているか |
| MEDIUM | SPF/DKIM/DMARC設定 | メール認証が適切に設定されているか |
| MEDIUM | 重複送信防止 | メール送信のレートリミット |
| LOW | メルマガ購読解除 | ワンクリック解除が可能か |

##### 3. SEO/OGP (MEDIUM)

| Priority | Check Item | Description |
|----------|------------|-------------|
| MEDIUM | titleタグ | 各ページに適切なtitleが設定されているか |
| MEDIUM | canonical URL | 正規URLが設定されているか |
| MEDIUM | noindex設定 | インデックスすべきでないページにnoindexがあるか |
| MEDIUM | サイトマップ | sitemap.xmlが生成されているか |
| MEDIUM | OGP設定 | og:title、og:description、og:imageが設定されているか |
| MEDIUM | Twitter Card | twitter:cardが設定されているか |

##### 4. 決済機能 (HIGH) ※該当する場合

| Priority | Check Item | Description |
|----------|------------|-------------|
| HIGH | 決済データ不整合検知 | Webhook処理とDB状態の整合性チェック |
| HIGH | 重複決済防止 | 冪等性キーの使用 |
| HIGH | サブスクリプション自動キャンセル | 失敗時の自動解約処理 |
| MEDIUM | 返金・日割り計算規約 | 規約の明記 |
| MEDIUM | カード期限切れ対応 | 事前通知と更新フロー |
| MEDIUM | インボイス制度対応 | 適格請求書の発行 |

##### 5. アクセシビリティ・パフォーマンス・運用 (MEDIUM/LOW)

| Priority | Check Item | Description |
|----------|------------|-------------|
| MEDIUM | 画像alt属性 | すべての意味のある画像にaltがあるか |
| MEDIUM | スクリーンリーダー対応 | aria属性、セマンティックHTML |
| MEDIUM | バンドルサイズ最適化 | 不要なライブラリの除去 |
| MEDIUM | CDN活用 | 静的アセットがCDN経由か |
| MEDIUM | 画像最適化 | next/image等の最適化使用 |
| MEDIUM | クロスブラウザ対応 | 主要ブラウザでの動作確認 |
| LOW | ファビコン | favicon.ico、apple-touch-iconの設定 |
| LOW | エラー通知 | Sentry等でエラー監視しているか |
| LOW | ローカライズ | html lang属性の設定 |

### 3. Issue作成
- 検出した各問題を`issues/`ディレクトリにmarkdownファイルとして作成
- ファイル名: `web-launch-{番号}-{短い説明}.md`
- `web-launch-001`から採番

## 制約
- **1問題 = 1issueファイル**: 複数の問題を1つのファイルにまとめない
- **具体的なコード参照**: 抽象的な指摘ではなく、具体的なファイル・行を示す
- **実装は行わない**: このスキルはレビューとissue作成のみ
- **既存issueと重複しない**: `issues/`の既存ファイルを確認
- **該当しない項目はスキップ**: 決済機能がなければ決済チェックは不要

## 出力形式

```markdown
# Issue: {問題のタイトル}

## Metadata

| Field | Value |
|-------|-------|
| **Category** | {Security/Email-Auth/SEO-OGP/Payment/Accessibility-Performance} |
| **Priority** | {CRITICAL/HIGH/MEDIUM/LOW} |
| **Check Item** | {チェック項目名} |
| **Affected File** | `{file-path}` |

## Problem Description

{問題の説明}

### Current Code/Configuration

\`\`\`typescript
{現在のコード/設定}
\`\`\`

### Issues

1. {問題点1}
2. {問題点2}

## Recommendation

{推奨される対応}

### Suggested Fix

\`\`\`typescript
{修正例}
\`\`\`

## Implementation Steps

1. [ ] ステップ1
2. [ ] ステップ2

## References

- https://zenn.dev/catnose99/articles/547cbf57e5ad28
- {その他の参考リンク}
```

## チェックポイント詳細

### セキュリティ

#### 認証Cookie設定
```typescript
// 確認ポイント: next-auth設定
// app/src/app/api/auth/[...nextauth]/route.ts
cookies: {
  sessionToken: {
    httpOnly: true,
    sameSite: 'lax', // または 'strict'
    secure: process.env.NODE_ENV === 'production',
  }
}
```

#### ユーザー入力バリデーション
```typescript
// NG: サーバーサイドのみ
const data = await request.json();
await db.insert(data);

// OK: Zodスキーマでバリデーション
const validated = schema.parse(await request.json());
await db.insert(validated);
```

#### レスポンスヘッダ
```typescript
// next.config.js での設定確認
headers: async () => [
  {
    source: '/:path*',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
    ],
  },
],
```

### メール・認証

#### メールアドレス列挙防止
```typescript
// NG: 存在有無を明かす
if (!user) return res.error('User not found');
if (wrongPassword) return res.error('Wrong password');

// OK: 同じメッセージ
return res.error('Invalid credentials');
```

### SEO/OGP

#### メタデータ設定
```typescript
// Next.js App Router
export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Description',
  openGraph: {
    title: 'OG Title',
    description: 'OG Description',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
  },
};
```

### アクセシビリティ

#### 画像alt属性
```tsx
// NG
<img src="/hero.png" />
<Image src="/hero.png" />

// OK
<img src="/hero.png" alt="ヒーロー画像の説明" />
<Image src="/hero.png" alt="ヒーロー画像の説明" />
```

## 注意事項
- 既存の`issues/`ファイルと重複しないよう確認する
- CRITICALとHIGHの問題を優先的に検出する
- プロジェクト固有の設計（Auth0、NextAuth.js等）を考慮する
- Next.js 15のベストプラクティスに従う
- 過度な指摘を避け、実用的な改善を提案する
