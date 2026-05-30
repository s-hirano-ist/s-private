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
pnpm deps:graph      # 依存関係グラフをmermaidとして出力（dependency-graph.md）
```

`deps:graph`はmermaid形式で出力するためGraphviz不要。生成物（`dependency-graph.md`）は**アーキテクチャ図としてコミット管理**し、GitHub・VS Code上でネイティブ描画する。月次で自動再生成されるため（CI連携を参照）、ローカルでは構成変更時に`pnpm deps:graph`で更新する。

グラフは「Clean Architectureの層境界・cross-domain禁止が守られているか」を一目で確認する用途のため、**層×ドメイン単位**まで粗く集約している:

- `--collapse '<regex>'`で集約。`core`/`application-services`/`infrastructures`はドメイン（`articles`/`books`/`images`/`notes`等）ごとのノードを残し（cross-domain依存の可視化）、`app`/`common`/`components`/`loaders`や各パッケージ（`ui`/`database`等）は1ノードに集約する。ドメイン内部のファイル詳細は描画しない。
- `--include-only '^(app/src|packages)/...'`でグラフ出力のみを絞り込み（ルール検査には不適用）、`node_modules`等の外部依存と`vitest`設定・`*.stories.*`などのノイズノードを除外する。

### CI連携

- **PR時**: [`depcruise.yaml`](../.github/workflows/depcruise.yaml) — [dependency-cruiser-report-action](https://github.com/MH4GF/dependency-cruiser-report-action)を使用し、依存関係分析レポートをPRコメントとして投稿
- **月次レポート**: [`update-reports.yaml`](../.github/workflows/update-reports.yaml) — 毎月1日に`dependency-graph.md`を再生成し、自動更新PRを作成


## Lint/Format: ESLint → oxlint、Biome → oxfmt 移行（2026-05）

ESLint を全廃し oxlint に一本化、続けて Biome も全廃し oxfmt に移行。設定は `.oxlintrc.json`（JSONC: コメント可。`oxlint.config.ts` は experimental でバイナリが読めないため不採用）。型認識ルールは `oxlint-tsgolint`（`pnpm lint` = `oxlint --type-aware`）。フォーマットは `.oxfmtrc.json`（`pnpm format` / `pnpm format:check`）。

役割分担:
- **oxlint**: 旧 ESLint の全ルール。typescript-eslint strict+stylistic type-checked（type-aware, tsgolint）、`@next/*`→native `nextjs`、`@vitest/*`→native `vitest`、`eslint-plugin-regexp`/`eslint-plugin-storybook`（JS plugin）、Prisma raw-SQL ガード（`eslint-js/no-restricted-syntax` via `oxlint-plugin-eslint`）。`@eslint-react` の明示ルールは native へ: use-state→`react/hook-use-state`、jsx-no-useless-fragment→`react/jsx-no-useless-fragment`、dom-no-dangerously-set-innerhtml→`react/no-danger`、no-array-index-key→`react/no-array-index-key`。set-state-in-effect は `eslint-plugin-react-hooks`（alias `react-hooks-js`）。
- **dependency-cruiser**: Clean Architecture 層境界（`eslint-plugin-boundaries` から移植。oxlint の JS plugin は `settings` の boundaries/* キーを受け付けず動作不可のため）。`.dependency-cruiser.cjs` の `boundary-*` ルール（allow-list を deny-list に翻訳、29 本）。
- **oxfmt**: format 全般（Prettier互換、タブ・行幅80）+ import 整理（sortImports）+ Tailwind class 並べ替え（sortTailwindcss、`cn`/`clsx`/`tv`）。旧 Biome の format + organizeImports + useSortedClasses を置換。
- 旧 Biome の base lint は oxlint へ吸収（`categories.correctness="error"` + style ルール移植: noParameterAssign→`no-param-reassign`、useSelfClosingElements→`react/self-closing-comp`、useNumberNamespace→`unicorn/prefer-number-properties`、noUselessElse→`no-else-return` ほか）。`noExplicitAny` は `typescript/no-explicit-any="error"` に統一。

新規有効化（旧コメントアウト分）: `jsx-a11y`（oxlint native, warn）。

移行できなかったもの（oxlint に等価なし）:
- `@eslint-react` の react-x 固有ルール（type-aware で JS plugin 不可）: no-unused-props, naming-convention-ref-name, no-context-provider, ほか strict-type-checked 群。本コードベースでは warning 8 件相当の損失（error 損失は 0）。
- `eslint-plugin-tailwindcss`: Tailwind v4（`tailwind.config.js` 無し）と非互換のため不採用。class 並べ替えは oxfmt `sortTailwindcss`（Tailwind v4 native）が担当。
- Biome 専用ルール `noUnusedTemplateLiteral` と `useSingleVarDeclarator`（oxlint に `one-var` 無し）は等価がなく削除（軽微なスタイル系のみ）。
