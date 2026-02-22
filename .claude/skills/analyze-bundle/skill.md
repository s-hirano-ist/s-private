---
name: analyze-bundle
description: Next.jsアプリのクライアントバンドルを分析し、最適化可能な箇所を特定してissue化する。
globs:
  - "app/next.config.mjs"
  - "app/package.json"
  - "app/.next/static/chunks/**"
---

# Analyze Bundle Skill

Next.jsアプリ（`s-private-app`）のクライアントバンドルサイズを分析し、最適化可能な箇所を検出する。

## ワークフロー

### 1. ビルド＆分析

```bash
# 最新のビルドを実施
pnpm --filter s-private-app build
```

ビルドが完了するまで待機する。

### 2. チャンクサイズ一覧取得

```bash
# JS/CSSチャンクをサイズ降順で一覧
ls -lhS app/.next/static/chunks/*.js
ls -lhS app/.next/static/chunks/*.css
```

### 3. チャンク内容の特定

各チャンク（特に上位10件）の中身を特定する。以下のスクリプトを `/tmp/identify-chunks.js` に書き出して実行:
※ 必要に応じてdetectors等は更新すること。更新の必要性が出てきたときは、本skillの内容にもアップデートを加えること。

```javascript
const fs = require("fs");
const path = require("path");

const chunksDir = process.argv[2];
const files = fs.readdirSync(chunksDir).filter(f => f.endsWith('.js')).sort((a, b) => {
  return fs.statSync(path.join(chunksDir, b)).size - fs.statSync(path.join(chunksDir, a)).size;
});

const detectors = [
  ["Next.js Runtime", c => c.includes("hydrateRoot") || c.includes("AppRouter") || (c.includes("__NEXT") && c.includes("ReactDOM"))],
  ["Sentry", c => c.includes("Sentry") || c.includes("@sentry") || c.includes("SENTRY_BAGGAGE")],
  ["Sentry Replay", c => c.includes("replayIntegration") || c.includes("rrweb")],
  ["react-syntax-highlighter", c => c.includes("SyntaxHighlighter") || c.includes("refractor")],
  ["next-intl", c => c.includes("next-intl") || c.includes("useTranslations")],
  ["next-auth", c => c.includes("AuthError") || c.includes("next-auth")],
  ["next-themes", c => c.includes("ThemeProvider") || c.includes("next-themes")],
  ["lucide-react", c => c.includes("createLucideIcon")],
  ["yet-another-react-lightbox", c => c.includes("Lightbox")],
  ["sonner", c => c.includes("sonner") || c.includes("Toaster")],
  ["@radix-ui", c => c.includes("radix")],
  ["@base-ui", c => c.includes("base-ui")],
  ["vaul/Drawer", c => c.includes("DrawerContent")],
  ["zod", c => c.includes("ZodError")],
  ["cmdk", c => c.includes("cmdk") || c.includes("CommandPrimitive")],
  ["Polyfills", c => c.includes("URLSearchParams") && c.includes("FormData") && c.includes("globalThis")],
  ["App Code", c => c.includes("LinkCard") || c.includes("ImageCard") || c.includes("search-card")],
];

let totalJS = 0;
for (const f of fs.readdirSync(chunksDir).filter(x => x.endsWith('.js'))) {
  totalJS += fs.statSync(path.join(chunksDir, f)).size;
}
console.log(`Total Client JS: ${(totalJS / 1024).toFixed(0)}KB\n`);

for (const file of files.slice(0, 15)) {
  const filePath = path.join(chunksDir, file);
  const size = fs.statSync(filePath).size;
  const content = fs.readFileSync(filePath, "utf-8");
  const found = [];
  for (const [name, detector] of detectors) {
    if (detector(content)) found.push(name);
  }
  console.log(`${file.padEnd(28)} ${(size / 1024).toFixed(0).padStart(5)}KB  ${found.join(", ") || "framework/other"}`);
}
```

実行:
```bash
node /tmp/identify-chunks.js app/.next/static/chunks/
```

### 4. 分析レポート作成

以下の情報をユーザーに報告:

1. **Client JS合計サイズ** と **CSS合計サイズ**
2. **チャンク内訳テーブル**（サイズ降順、含まれるライブラリ）
3. **最適化候補**:
   - クライアントバンドルに不要なライブラリ（サーバーコンポーネントで十分なもの）
   - `next/dynamic` で遅延読み込み可能なもの（ユーザー操作時のみ必要）
   - 設定変更で削減できるもの（Sentry等）
   - 不要なPolyfillsや重複
4. **推定削減効果**（各項目のKBと合計%）

### 5. Issue作成（新規最適化ポイントの場合）

既存の `issues/perf-*.md` と重複しない新規の最適化ポイントが見つかった場合、issueファイルを作成する。

- ファイル名: `perf-{番号}-{短い説明}.md`
- 既存の最大番号+1 から採番

```markdown
# Issue: {タイトル}（~{削減見込み}KB 削減）

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Performance |
| **Priority** | {HIGH/MEDIUM/LOW} |
| **Check Item** | クライアントバンドルサイズ削減 |
| **Affected File** | `{file-path}` |

## Problem Description

{問題の説明}

### Current Code/Configuration

\`\`\`typescript
// 現在のコード
\`\`\`

## Recommendation

{改善方針}

### Suggested Fix

\`\`\`typescript
// 修正後のコード
\`\`\`

## Implementation Steps

1. [ ] ステップ1
2. [ ] ステップ2
```

## 判断基準

| サイズ | 優先度 | 対応 |
|--------|--------|------|
| 100KB+ | HIGH | 即時対応推奨 |
| 30-100KB | MEDIUM | 計画的に対応 |
| 10-30KB | LOW | 余裕があれば |
| <10KB | INFO | 報告のみ |

## 注意事項

- Next.js Runtime / React DOM / react自体のサイズは削減不可（参考情報として報告のみ）
- `next-intl` は i18n基盤のため削減困難（報告のみ）
- サーバーコンポーネントのインポートはクライアントバンドルに影響しない
- `"use client"` コンポーネントのインポートのみが対象
- 既存の `issues/perf-*.md` を必ず確認し、重複issue作成を避ける
