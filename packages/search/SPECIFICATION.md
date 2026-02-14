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
- テキスト = `title + ogTitle + ogDescription + quote + url` を改行結合

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

**DB連携パーサー（`parseDbNote`, `parseDbArticle`）:**
- DB上のnote/articleも同一チャンカーで処理可能
- `doc_id` = `db:note:{id}` / `db:article:{id}` 形式

## 5. ペイロード構造

```typescript
type QdrantPayload = {
  type: "markdown_note" | "bookmark_json";
  top_heading: string;       // カテゴリ/見出しルート
  doc_id: string;            // "file:{path}" or "db:{type}:{id}"
  chunk_id: string;          // "{doc_id}#{index}"
  title: string;             // セクションタイトル
  url?: string;              // ブックマークのみ
  heading_path: string[];    // 見出し階層パス
  text: string;              // チャンクテキスト本文
  content_hash: string;      // SHA256先頭16文字（変更検出用）
};
```

## 6. Embedding

- モデル: `intfloat/multilingual-e5-small`（384次元）
- E5プレフィックス: `query: `（検索時）/ `passage: `（格納時）
- ローカル実行（HuggingFace Transformers）またはリモートAPI
- 設定: `packages/search/src/config.ts`

## 7. ベクトルDB (Qdrant)

- コレクション: `knowledge_v1`
- ベクトルサイズ: 384
- 距離関数: Cosine
- ペイロードインデックス: `type`（keyword）, `top_heading`（keyword）
- ポイントID: `chunk_id` の文字列ハッシュ → unsigned 32bit整数

## 8. Ingestパイプライン

ソース: `packages/search/src/ingest.ts`, `packages/scripts/src/rag/ingest.ts`

```
ファイル一覧(glob) → パース(chunker) → 変更検出(hash比較) → バッチEmbed(20件) → Qdrant Upsert
```

- 変更検出: `content_hash` で差分のみ処理
- バッチサイズ: 20
- リトライ: 最大3回、2秒間隔
- バッチ間ディレイ: 100ms

## 9. 検索フロー

```
クエリ → "query: " プレフィックス付きEmbed → Qdrant vector search → フィルタ適用 → SearchResult[]
```

- フィルタ: `type`, `top_heading` による絞り込み
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
