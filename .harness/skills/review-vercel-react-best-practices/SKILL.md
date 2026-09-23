---
name: review-vercel-react-best-practices
description: TypeScript、React、Next.jsコードをvercel-react-best-practicesに照らして性能レビューし、改善候補をGitHub Issuesへ記録する。データ取得、bundle、rendering、re-renderの監査を依頼されたときに使用する。
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
- 検出した各問題をGitHub Issuesに登録
- タイトルには性能上の問題を具体的に示す

## 制約
- **1問題 = 1 Issue**: 複数の問題を1つのIssueにまとめない
- **具体的なコード参照**: 抽象的な指摘ではなく、具体的なファイル・行を示す
- **実装は行わない**: このスキルはレビューとissue作成のみ
- **既存issueと重複しない**: GitHub Issuesの既存課題を確認

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

- Rule: `../vercel-react-best-practices/rules/{rule-name}.md`
```

## 注意事項
- GitHub Issuesの既存課題と重複しないよう確認する
- CRITICALとHIGHの問題を優先的に検出する
