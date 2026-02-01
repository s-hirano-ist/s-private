---
name: review-vercel-react-best-practices
description: Review the project code by vercel-react-best-practices.
globs:
  - "**/*.tsx"
  - "**/*.ts"
---

# Review Vercel React Best Practices Skill

プロジェクトコードをvercel-react-best-practicesに照らし合わせてレビューし、改善候補をissue化する。

## ワークフロー

### 1. パターン確認
- `/vercel-react-best-practices`スキルの内容を確認
- 57ルール x 8カテゴリを把握

### 2. コードベーススキャン
- プロジェクト内の`.tsx`/`.ts`ファイルを探索
- 優先度順に以下のアンチパターンを検出:
  - **CRITICAL**: Waterfalls (async-*), Bundle Size (bundle-*)
  - **HIGH**: Server-Side Performance (server-*)
  - **MEDIUM-HIGH**: Client-Side Data Fetching (client-*)
  - **MEDIUM**: Re-render/Rendering (rerender-*, rendering-*)
  - **LOW-MEDIUM**: JavaScript Performance (js-*)
  - **LOW**: Advanced Patterns (advanced-*)

### 3. Issue作成
- 検出した各問題を`issues/`ディレクトリにmarkdownファイルとして作成
- ファイル名: `perf-{番号}-{短い説明}.md`
- compositionとは別シリーズで採番（`perf-001`から開始）

## 制約
- **1問題 = 1issueファイル**: 複数の問題を1つのファイルにまとめない
- **具体的なコード参照**: 抽象的な指摘ではなく、具体的なファイル・行を示す
- **実装は行わない**: このスキルはレビューとissue作成のみ
- **既存issueと重複しない**: `issues/`の既存ファイルを確認

## 出力形式

```markdown
# Issue: {問題のタイトル}

## Metadata

| Field | Value |
|-------|-------|
| **Pattern Violation** | `{rule-name}` |
| **Priority** | {CRITICAL/HIGH/MEDIUM/LOW} |
| **Impact** | {説明} |
| **Affected File** | `{file-path}` |

## Problem Description

{アンチパターンの説明}

### Current Code

\`\`\`tsx
// 問題のあるコード
\`\`\`

### Issues

1. {問題点1}
2. {問題点2}

## Proposed Solution

{vercel-react-best-practicesに基づく修正方針}

### Refactored Code

\`\`\`tsx
// 改善後のコード
\`\`\`

## Implementation Steps

1. [ ] ステップ1
2. [ ] ステップ2

## Related Patterns

- Rule: `.claude/skills/vercel-react-best-practices/rules/{rule-name}.md`
```

## 注意事項
- 既存の`issues/`ファイルと重複しないよう確認する
- 番号は`perf-001`から採番（compositionとは別シリーズ）
- CRITICALとHIGHの問題を優先的に検出する
