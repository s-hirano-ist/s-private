# Search パッケージ仕様書

## 1. 概要

RAGベースのベクトル検索システム。
s-contentsリポジトリおよびDBのコンテンツを Qdrant に格納し、セマンティック検索を提供する。

## 2. データソース一覧

| ソース | glob パターン | Qdrant type | 備考 |
|--------|-------------|-------------|------|
| ノート | `markdown/note/**/*.md` | `markdown_note` | YAML frontmatter あり |
| 書籍メモ | `markdown/book/**/*.md` | `markdown_note` | frontmatter なし、ISBNファイル名 |
| ブックマーク | `json/article/**/*.json` | `bookmark_json` | カテゴリ別JSON |

ingest設定: `packages/scripts/src/rag/ingest-config.ts`

## 3. 各データ形式の詳細

### 3.1 Markdown Note (`markdown/note/**/*.md`)

```
---
heading: architecture
description: 建築とは?
draft: false
---

## セクション見出し
本文テキスト...
```

- `heading`: カテゴリ名 → `top_heading` に使用
- `draft: true` のファイルはスキップ
- H2/H3 で見出し分割

### 3.2 Markdown Book (`markdown/book/**/*.md`)

```
# 書籍タイトル

本文テキスト...

## セクション
...
```

- frontmatter なし → パーサーが `heading: "unknown"` を割り当て
- ファイル名は ISBN（例: `9784003362211.md`）
- H1 がタイトルだが、チャンカーはH2/H3のみ分割対象 → H1以下〜最初のH2 までの本文はチャンクに含まれない可能性あり

### 3.3 Article JSON (`json/article/**/*.json`)

```json
{
  "heading": "ai",
  "description": "AIについて",
  "body": [
    {
      "title": "記事タイトル",
      "url": "https://...",
      "ogImageUrl": "...",
      "ogTitle": "...",
      "ogDescription": "...",
      "quote": "引用テキスト"
    }
  ]
}
```

- `heading` → `top_heading` に使用
- 各 `body` 要素が1チャンク
- テキスト = `title + ogTitle(titleと異なる場合) + ogDescription + quote` を改行結合

## 4. チャンキング戦略

ソース: `packages/search/src/chunker.ts`

**Markdown系:**
1. frontmatter 解析（YAML簡易パーサー）
2. H2/H3 見出しで階層分割（`splitMarkdownByHeadings`）
3. 各セクションが `maxChunkLength`(2000文字) 超過時にパラグラフ分割
4. `heading_path` = `[frontmatter.heading, ...見出し階層]`

**JSON系:**
- 各body要素 = 1チャンク（分割なし）
- `heading_path` = `[json.heading]`

**DB連携パーサー:**

`parseDbNote(noteId, title, markdown)`:
- DB上のnoteをMarkdownチャンカーで処理
- `doc_id` = `db:note:{noteId}`

`parseDbArticle(article)`:
- 引数: `{ id, title, url, ogTitle?, ogDescription?, quote?, categoryName }`
- DB上のarticleを1チャンクとして処理
- `doc_id` = `db:article:{id}`

## 5. ペイロード構造

```typescript
type ContentType = "articles" | "books" | "notes";

type QdrantPayload = {
  type: "markdown_note" | "bookmark_json";
  content_type: ContentType;   // コンテンツ種別
  top_heading: string;         // カテゴリ/見出しルート
  doc_id: string;              // "file:{path}" or "db:{type}:{id}"
  chunk_id: string;            // "{doc_id}#{index}"
  title: string;               // セクションタイトル
  url?: string;                // ブックマークのみ
  heading_path: string[];      // 見出し階層パス
  text: string;                // チャンクテキスト本文
  content_hash: string;        // SHA256先頭16文字（変更検出用）
};

type SearchResult = {
  score: number;
  text: string;
  title: string;
  url?: string;
  heading_path: string[];
  type: "markdown_note" | "bookmark_json";
  content_type: ContentType;
  doc_id: string;
};
```

## 6. Embedding

- モデル: `intfloat/multilingual-e5-small`（384次元）
- E5プレフィックス: `query: `（検索時）/ `passage: `（格納時）
- ローカル実行（HuggingFace Transformers）またはリモートAPI
- 設定: `packages/search/src/config.ts`

**リモートAPI (`createEmbeddingClient`):**

```typescript
type EmbeddingClientConfig = {
  apiUrl: string;                // Embedding APIのベースURL
  apiKey: string;                // Bearer認証トークン
  cfAccessClientId: string;      // Cloudflare Access Client ID
  cfAccessClientSecret: string;  // Cloudflare Access Client Secret
};
```

- エンドポイント: `POST /embed`（単発）, `POST /embed-batch`（バッチ）
- タイムアウト: 単発 30秒 / バッチ 60秒
- Cloudflare Access対応: `CF-Access-Client-Id`, `CF-Access-Client-Secret` ヘッダーを付与

## 7. ベクトルDB (Qdrant)

- コレクション: `knowledge_v1`
- ベクトルサイズ: 384
- 距離関数: Cosine
- ペイロードインデックス: `type`（keyword）, `top_heading`（keyword）, `content_type`（keyword）
- ポイントID: `chunk_id` の文字列ハッシュ → unsigned 32bit整数

**`getCollectionStats()`:**
- コレクション統計取得（`pointsCount`, `status`）
- コレクション未作成時は `{ pointsCount: 0, status: "not_found" }` を返却

## 8. Ingestパイプライン

ソース: `packages/search/src/ingest.ts`, `packages/scripts/src/rag/ingest.ts`

```
ファイル一覧(glob) → パース(chunker) → 変更検出(hash比較) → バッチEmbed(20件) → Qdrant Upsert
```

```typescript
type IngestOptions = {
  embedBatchFn?: (texts: string[], isQuery?: boolean) => Promise<number[][]>;
  force?: boolean;  // true で変更検出をバイパスし全チャンクを再処理
};

type IngestResult = {
  totalChunks: number;
  changedChunks: number;
  skippedChunks: number;
};
```

- 変更検出: `content_hash` で差分のみ処理（`force: true` でバイパス可能）
- バッチサイズ: 20
- リトライ: 最大3回、2秒間隔
- バッチ間ディレイ: 100ms

## 9. 検索フロー

```
クエリ → "query: " プレフィックス付きEmbed → Qdrant vector search → フィルタ適用 → SearchResult[]
```

- フィルタ: `type`, `top_heading`, `content_type` による絞り込み
  - `content_type`: 単一値（`ContentType`）または配列（`ContentType[]`）でOR検索が可能
- デフォルト topK: 10

## 参照ファイル

- `packages/search/src/config.ts` - 設定・型定義
- `packages/search/src/chunker.ts` - チャンキングロジック
- `packages/search/src/embedding.ts` - ローカルEmbed
- `packages/search/src/embedding-client.ts` - リモートEmbed
- `packages/search/src/qdrant-client.ts` - Qdrant操作
- `packages/search/src/ingest.ts` - Ingestコアロジック
- `packages/scripts/src/rag/ingest.ts` - Ingest CLIエントリポイント
- `packages/scripts/src/rag/ingest-config.ts` - globパターン設定
