# コード分析ツール

プロジェクトでは3つのコード分析ツールを使用して、コード品質とアーキテクチャの健全性を維持している。

## Knip（デッドコード検出）

未使用のファイル、エクスポート、依存関係を検出する静的解析ツール。

### 検出対象

- 未使用ファイル（どこからもimportされていないモジュール）
- 未使用エクスポート（exportされているが使われていないシンボル）
- 未使用依存関係（package.jsonに記載されているが使われていないパッケージ）

### 設定

設定ファイル: [`knip.json`](../knip.json)

モノレポの各ワークスペースごとにエントリーポイントと除外設定を定義:

- **app**: Next.jsの規約ファイル（`page.tsx`, `layout.tsx`, `route.ts`等）をエントリーポイントとして自動認識。`instrumentation.ts`や`i18n/request.ts`等のNext.js内部ファイルはignore対象
- **packages/ui**: `ui/`, `forms/`, `display/`, `layouts/`, `providers/`, `hooks/`, `utils/`配下のファイルがエントリーポイント。Storybookファイル・テストファイルは除外
- **packages/core**: 全`.ts`ファイルがエントリーポイント（テストファイルは除外）
- **packages/database**: Prisma関連の依存関係をignore

`ignoreExportsUsedInFile: true`により、同一ファイル内で使用されているexportは未使用扱いしない。

### コマンド

```bash
pnpm knip    # デッドコード検出を実行
```

## jscpd（コード重複分析）

コピー＆ペーストされた重複コードを検出するツール。

### 設定

設定ファイル: [`.jscpd.json`](../.jscpd.json)

| 項目 | 値 |
|------|-----|
| 重複率閾値 | 10% |
| 対象パターン | `**/*.{ts,tsx}` |
| 分析パス | `app/src`, `packages/ui`, `packages/core` |

除外対象:
- `node_modules`, `.next`, `dist`, `.storybook-static`, `coverage`
- テストファイル（`*.test.ts`）
- 生成ファイル（`app/src/generated/**`）

### コマンド

```bash
pnpm jscpd          # コンソールに重複レポートを出力
pnpm jscpd:json     # JSON形式のレポートを ./jscpd-report/ に出力
pnpm jscpd:summary  # サマリーを jscpd-summary.txt に出力
```

### CI連携

- **PR時**: [`jscpd.yaml`](../.github/workflows/jscpd.yaml) — PRごとに重複率を分析し、結果をPRコメントとして投稿。閾値超過時は警告を表示。レポートはArtifactとして90日間保存
- **月次レポート**: [`update-reports.yaml`](../.github/workflows/update-reports.yaml) — 毎月1日に`jscpd-summary.txt`を自動更新するPRを作成

## dependency-cruiser（依存関係分析）

モジュール間の依存関係を分析し、アーキテクチャルールへの違反を検出するツール。

### 設定

設定ファイル: [`.dependency-cruiser.cjs`](../.dependency-cruiser.cjs)

### ドメイン境界ルール（severity: error）

`packages/core`内の4ドメイン間の相互importを禁止:

| ルール名 | from | to（禁止） |
|----------|------|-----------|
| `no-cross-domain-import-from-articles` | `packages/core/articles/` | `books`, `notes`, `images` |
| `no-cross-domain-import-from-books` | `packages/core/books/` | `articles`, `notes`, `images` |
| `no-cross-domain-import-from-notes` | `packages/core/notes/` | `articles`, `books`, `images` |
| `no-cross-domain-import-from-images` | `packages/core/images/` | `articles`, `books`, `notes` |

各ドメインは`shared-kernel`経由でのみ共通機能を利用できる。

### 汎用ルール

| ルール名 | severity | 検出内容 |
|----------|----------|---------|
| `no-circular` | warn | 循環依存 |
| `no-orphans` | warn | 孤立モジュール（どこからも参照されていないファイル） |
| `no-deprecated-core` | warn | 非推奨のNode.jsコアモジュールの使用 |
| `not-to-deprecated` | warn | 非推奨npmパッケージへの依存 |
| `no-non-package-json` | error | package.jsonに未記載のnpmパッケージへの依存 |
| `not-to-unresolvable` | error | 解決不能なモジュールへの依存 |
| `no-duplicate-dep-types` | warn | dependencies/devDependencies両方に存在するパッケージ |
| `not-to-spec` | error | テストファイルへの依存（プロダクションコードから） |
| `not-to-dev-dep` | error | devDependenciesへのプロダクションコードからの依存 |

### コマンド

```bash
pnpm deps:check      # 依存関係ルールのチェック（全ルール適用）
pnpm deps:circular   # 循環依存の検出（テキスト出力）
pnpm deps:graph      # 依存関係グラフをSVGとして出力（dependency-graph.svg）
```

`deps:graph`の実行にはGraphviz（`dot`コマンド）が必要。

### CI連携

- **PR時**: [`depcruise.yaml`](../.github/workflows/depcruise.yaml) — [dependency-cruiser-report-action](https://github.com/MH4GF/dependency-cruiser-report-action)を使用し、依存関係分析レポートをPRコメントとして投稿
