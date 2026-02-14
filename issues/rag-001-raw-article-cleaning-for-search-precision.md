# Issue: raw/article のボイラープレート除去によるRAG検索精度改善

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Data Quality / RAG |
| **Priority** | HIGH |
| **Check Item** | 検索精度・チャンク品質 |
| **Affected File** | `packages/scripts/src/rag/chunker.ts`, `packages/scripts/src/rag/ingest.ts`, `packages/scripts/src/rag/config.ts` |

## Problem Description

`raw/article/` の ~1094件のMarkdownファイルは、HTML→Markdown変換(Turndown)で生成されたもの。Turndownは `<script>`, `<style>`, `<nav>`, `<footer>`, `<aside>` を除去しているが、多くのサイトはボイラープレートを `<div>`, `<header>`, `<section>` 等に入れているため除去しきれていない。

### 現状の問題点

1. **ファイル内容の ~47% が空行** — 交互に空行が挟まるパターン
2. **HTMLアーティファクトがそのまま残存**:
   - サイトナビゲーション（ヘッダーリンク、サイドバーカテゴリ一覧）
   - ロゴ画像・alt text
   - SNSシェアボタン・URL
   - 「関連記事」「人気記事」セクション
   - ログイン/会員登録UI
   - パンくずリスト
   - 著者プロフィール・SNSリンク
   - 広告・プロモーション
   - フッター
   - 言語選択メニュー
3. **`## Quote` セクションが `undefined`** — quoteが取得できなかった場合
4. **ファイル名がURL-encoded** — doc IDとして使用される

### チャンカーへの影響

チャンカー(`chunker.ts`)は `##` / `###` で分割するため:

- `## 記事のカテゴリー` → カテゴリリンクだけのチャンク
- `## 今週の人気` → 無関係な記事リストのチャンク
- `## TOP100` → 無関係な記事ランキングのチャンク
- `## RANKING` → 同上
- `#### こんな記事も読まれています` → 関連記事リンクのチャンク
- `#### この記事のシェアと配信` → SNSボタンのチャンク

加えて、最初の `##` 見出し前のコンテンツ（記事冒頭の本文）は `splitMarkdownByHeadings` で捨てられている。

### 検索精度への影響

- **推定30-50%のチャンクが純粋なノイズ** — ベクトル空間を汚染
- 全記事共通のボイラープレート（ナビ等）が偽の類似性を生む
- チャンクのトークン予算がリンクURL・UI要素に浪費される
- クエリがノイズチャンクにマッチしてしまう

### 具体例: `blog.tinect.jp/?p=85752`

| 行範囲 | 内容 | 判定 |
|--------|------|------|
| 1-70 | ヘッダー、ナビ、カテゴリ、SNSボタン | ノイズ |
| 71-195 | **記事本文** | 有用 |
| 197-234 | ウェビナー宣伝 | ノイズ |
| 236-370 | 著者プロフィール、関連記事、人気記事、TOP100 | ノイズ |

→ 全370行中、有用なのは125行 (**34%**) のみ

## Recommendation

**チャンカー内でクリーニングを適用する**（ソースファイルは変更しない）。

理由:
- `raw/article/` はアーカイブとして原本を保持
- 別ディレクトリへのコピーはストレージとsync複雑化を招く
- ハッシュベース変更検知により、クリーニングロジック更新時に自動で再embeddingが走る

### 新規ファイル: `article-cleaner.ts`

`packages/scripts/src/rag/article-cleaner.ts` に `cleanArticleMarkdown(content: string)` を作成。

**処理パス:**

1. **エンベロープ抽出**: `# [title](url)` → title/url、`## Quote` → quote（`undefined`なら空）、`## Content` 以降 → body
2. **ボイラープレート見出しセクション除去**: 以下パターンに合致する見出し＋その配下コンテンツを丸ごと削除
   ```
   記事のカテゴリー, 今週の人気, TOP\d+, RANKING, 人気エントリ, 注目エントリ,
   関連記事, こんな記事も読まれています, シェアと配信, アーカイブ,
   おすすめ記事, 新着記事, 著者プロフィール, Product Blogをもっと見る,
   Related Articles, Popular Posts, Share, etc.
   ```
3. **先頭ボイラープレート除去**: コンテンツ冒頭のナビリンク列、ロゴ画像、パンくず、ログインUI等
4. **末尾ボイラープレート除去**: Copyright、フッターナビ、ランキングリスト、月別アーカイブリスト等
5. **インラインノイズ除去**:
   - 連続空行を `\n\n` に圧縮
   - 行末空白除去
   - SNSシェアボタン行（`twitter.com/intent/tweet`, `b.hatena.ne.jp` 等を含むリスト項目）
   - UI要素のみの画像行
   - `anond.hatelabo.jp` のキーワードリンク展開（`[word](https://anond.hatelabo.jp/keyword/...)` → `word`）
6. **再構成**: クリーンなMarkdownとして `{ title, url, quote, body }` を返す

### `chunker.ts` の修正

- `parseArticleMarkdown(filePath, content)` 関数を追加（`article-cleaner.ts` を呼び出してからセクション分割）
- `splitMarkdownByHeadings` で最初の見出し前のコンテンツも "introduction" セクションとして捕捉
- 最小チャンク長フィルタ（50文字未満のチャンクをスキップ）

### `ingest.ts` の修正

```typescript
function parseFile(file: FileInfo): QdrantPayload[] {
  const content = readFileSync(file.path, "utf-8");
  if (file.type === "json") return parseJsonArticle(file.path, content);
  if (file.path.includes("raw/article/")) return parseArticleMarkdown(file.path, content);
  return parseMarkdown(file.path, content);
}
```

### `config.ts` の修正（任意）

payloadのtypeに `"raw_article"` を追加して検索時フィルタリングを可能にする。

## Implementation Steps

1. [ ] `article-cleaner.ts` を新規作成（6段階のクリーニングパイプライン）
2. [ ] `chunker.ts` に `parseArticleMarkdown` を追加
3. [ ] `chunker.ts` の `splitMarkdownByHeadings` でpre-headingコンテンツ捕捉を追加
4. [ ] `ingest.ts` の `parseFile` に `raw/article/` ルーティングを追加
5. [ ] `config.ts` に `"raw_article"` type を追加（任意）
6. [ ] サンプルファイルでクリーニング結果を目視確認
7. [ ] クリーニング前後のチャンク数を比較（30-50%減が期待値）
8. [ ] `rag-ingest` を実行してQdrantに投入
9. [ ] `rag-search` で代表的なクエリを実行し、ノイズチャンクが上位に来ないことを確認

## References

- `packages/scripts/src/rag/chunker.ts` — 現行チャンカー実装
- `packages/scripts/src/rag/ingest.ts` — インジェストパイプライン
- `packages/scripts/src/rag/config.ts` — RAG設定
- `packages/scripts/src/update-raw-articles.ts` — 記事取得・Markdown変換（Turndown設定）
- `raw/article/blog.tinect.jp%2F%3Fp%3D85752.md` — 問題の典型例
