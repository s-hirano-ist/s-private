---
name: work-issue
description: issues/ディレクトリのタスクを1つ実装し、PRを作成するワークフロー
globs:
  - "issues/**/*.md"
---

# Issue Workflow Skill

issues/ディレクトリのタスクを処理し、コミットする。

## ワークフロー（ループ処理）

issueがなくなるまで以下を繰り返す:

### 1. タスク取得
- `issues/`ディレクトリの`.md`ファイル（.gitkeep除く）を検索
- 最初に見つかったファイルを自動選択
- **issueがない場合はループ終了**

### 2. 実装
- issueファイルの内容を読み込み
- 指示に従って実装を行う
- CLAUDE.mdのルールに従う

### 3. コミット
- issueファイルを削除
- 変更をステージング
- 1コミットで完了

### 4. 次のissueへ
- **ステップ1に戻り、次のissueを処理**

## 制約
- **ghコマンド禁止**: PR作成やGitHub操作は行わない
- **ブランチ切り替え禁止**: 現在のブランチで作業する
- **1issue = 1コミット**

## コマンド例

```bash
# 実装後
git add {changed-files} issues/{issue-name}.md
git commit -m "..."
# ループ継続...
```

## 注意事項
- issueファイルは実装完了後に削除する
- 削除はコミットに含める
- **すべてのissueを処理するまで継続する**
