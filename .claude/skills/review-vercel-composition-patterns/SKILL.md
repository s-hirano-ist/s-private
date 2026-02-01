---
name: review-vercel-composition-patterns
description: Review the project code by vercel-composition-patterns.
globs:
  - "**/*.tsx"
  - "**/*.ts"
---

# Review Vercel Composition Patterns Skill

プロジェクトコードをvercel-composition-patternsに照らし合わせてレビューし、改善候補をissue化する。

## ワークフロー

### 1. パターン確認
- `/vercel-composition-patterns`スキルの内容を確認
- 対象となるアンチパターンを把握

### 2. コードベーススキャン
- プロジェクト内の`.tsx`/`.ts`ファイルを探索
- 以下のアンチパターンを検出:
  - Boolean prop proliferation（複数のboolean propsによる条件分岐）
  - Render props misuse（適切でないrender props使用）
  - Context coupling（過度なContext依存）
  - State management issues（状態管理の問題）

### 3. Issue作成
- 検出した各問題を`issues/`ディレクトリにmarkdownファイルとして作成
- ファイル名: `composition-{番号}-{短い説明}.md`
- 内容に含めるもの:
  - 問題の説明
  - 該当ファイルパス
  - 推奨される修正方針
  - 参照パターン

## 制約
- **1問題 = 1issueファイル**: 複数の問題を1つのファイルにまとめない
- **具体的なコード参照**: 抽象的な指摘ではなく、具体的なファイル・行を示す
- **実装は行わない**: このスキルはレビューとissue作成のみ

## 出力形式

```markdown
# {問題のタイトル}

## 問題
{アンチパターンの説明}

## 該当箇所
- `path/to/file.tsx`

## 推奨修正
{vercel-composition-patternsに基づく修正方針}

## 参照
- vercel-composition-patterns: {該当パターン名}
```

## 注意事項
- 既存の`issues/`ファイルと重複しないよう確認する
- 番号は既存issueの続きから採番する
