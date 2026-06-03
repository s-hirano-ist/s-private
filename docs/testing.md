# Testing

## Commands

- `pnpm test` - Run all Vitest test projects (app, components, core, notification, search, storybook)
- `pnpm test:watch` - Run Vitest in watch mode
- `pnpm typecheck` - Run TypeScript type checking across all workspaces (`tsc --noEmit`)

## Vitest Workspace Configuration

The project uses Vitest workspace to manage tests across multiple packages:
- **Workspace Root**: `vitest.config.ts` defines test projects via `test.projects`: `app`, `components` (packages/ui), `core`, `notification`, `search`, `storybook` (browser mode), plus benchmark projects `bench` and `app-bench`
- **Individual Configs**: Each package has its own `vitest.config.ts` with specific settings
- **Unified Execution**: Run all tests from the root with `pnpm test`

## Test Setup per Package

### app
- **Environment**: happy-dom with Next.js-specific mocks (auth, prisma, minio, env)
- **Config**: [app/vitest.config.ts](../app/vitest.config.ts)
- **Setup**: [app/vitest-setup.tsx](../app/vitest-setup.tsx)
- **Features**: Includes Storybook integration with browser testing

### packages/ui (project: components)
- **Environment**: happy-dom for React component testing
- **Config**: [packages/ui/vitest.config.ts](../packages/ui/vitest.config.ts)
- **Setup**: [packages/ui/vitest-setup.tsx](../packages/ui/vitest-setup.tsx)

### packages/core
- **Environment**: Node for domain logic testing
- **Config**: [packages/core/vitest.config.ts](../packages/core/vitest.config.ts)
- **Setup**: [packages/core/vitest-setup.tsx](../packages/core/vitest-setup.tsx)

### packages/notification
- **Environment**: Node
- **Config**: [packages/notification/vitest.config.ts](../packages/notification/vitest.config.ts)

### packages/search
- **Environment**: Node（root `vitest.config.ts` 内にインライン定義、専用ファイルなし）

### storybook
- **Environment**: Browser mode（Chromium via `@vitest/browser` + `@vitest/browser-playwright`）
- **Setup**: [.storybook/vitest.setup.ts](../.storybook/vitest.setup.ts)

## Technologies

- **Test Framework**: Vitest with `@testing-library/react` for component tests
- **Coverage**: `@vitest/coverage-v8` enabled for all packages
- **Type Checking**: TypeScript type checking enabled in tests
- **Storybook**: Component testing with coverage support and Playwright browser testing

## Component Benchmarks

Vitest bench によるコンポーネントレンダリングのベンチマーク。

```bash
pnpm bench              # パッケージベンチマークのみ（bench project）
pnpm bench:components   # コンポーネントベンチマークのみ
pnpm bench:all          # 全ベンチマーク（packages + components）
```

詳細は [performance-profiling.md](./performance-profiling.md) を参照。

## Storybook Accessibility Testing

Storybookの全ストーリーに対して axe-core ベースのa11yテストを自動実行する。

### 仕組み

- `@storybook/addon-a11y` がインストール済み
- `.storybook/preview.tsx` で `a11y: { test: "error" }` を設定 → a11y違反時にテスト失敗
- a11yのannotationsは `@storybook/addon-vitest` の `storybookTest()` プラグイン（`vitest.config.ts`）が `.storybook/preview.tsx` 経由で自動適用。`.storybook/vitest.setup.ts` は `next/navigation` / `next-intl/server` のモック専用
- `pnpm test` の `--project storybook` で自動実行（CI含む）

### axe-core ルール設定

`.storybook/preview.tsx` の `parameters.a11y` で設定:

- **有効ルール** (`options.rules`): `html-has-lang`, `html-lang-valid`, `color-contrast`, `image-alt`, `label`, `landmark-unique`
- **無効ルール** (`config.rules`): `region`（Storybook環境ではlandmark不要）

### ストーリー単位でのa11y無効化

インタラクションテスト等でa11yチェックが不要な場合:

```typescript
export const MyStory: Story = {
  parameters: { a11y: { disable: true } },
};
```

### 実行コマンド

```bash
# Storybookテストのみ実行（a11y含む）
pnpm vitest run --project storybook

# 全テスト実行（a11y含む）
pnpm test
```

## Mutation Testing（Stryker Mutator）

[Stryker Mutator](https://stryker-mutator.io/) によるミューテーションテスト。コードに意図的な変異（mutant）を加え、テストがそれを検知できるか（killed）を計測する。

### 対象

`packages/core/` のドメインロジック層:
- `**/entities/*.ts`
- `**/events/*.ts`
- `**/services/*.ts`
- `**/errors/*.ts`

### コマンド

```bash
pnpm test:mutation        # ミューテーションテスト実行（デフォルト設定）
pnpm test:mutation:core   # packages/core対象のミューテーションテスト実行
```

### Thresholds

| レベル | スコア | 意味 |
|-------|--------|------|
| high | 80% | 良好 |
| low | 60% | 警告 |
| break | 50% | CI失敗 |

### レポート

HTMLレポートが `reports/mutation/index.html` に生成される（`.gitignore`で除外済み）。

### CI統合

GitHub Actionsの `mutation-test.yaml` ワークフローで、PRにて `packages/core/**/*.ts` または `stryker.config.json` が変更された場合に自動実行。レポートはartifactとして14日間保持。

### 設定

- 設定ファイル: [`stryker.config.json`](../stryker.config.json)
- テストランナー: `@stryker-mutator/vitest-runner`
- 型チェッカー: `@stryker-mutator/typescript-checker`

## Chaos レジリエンステスト（Playwright CDP）

Playwright の CDP (Chrome DevTools Protocol) を使ったネットワークシミュレーションにより、UIレジリエンスを検証する。

### 前提条件

- アプリケーションが `http://localhost:3000` で起動済み、または `webServer` 設定で自動起動
- `E2E_AUTH0_USERNAME` / `E2E_AUTH0_PASSWORD` 環境変数の設定
- Chromium ブラウザ（CDP はChromiumのみ対応）

### コマンド

```bash
pnpm test:chaos           # 全Chaosテスト実行
pnpm test:chaos --headed  # ブラウザ表示付きで実行
```

### テストシナリオ

| テストファイル | シナリオ | 検証内容 |
|--------------|---------|---------|
| `e2e/chaos/network-delay.spec.ts` | 3G遅延 | loading表示、タブナビゲーション、フォーム送信 |
| `e2e/chaos/network-offline.spec.ts` | オフライン | エラーtoast、ナビゲーション、復帰後リカバリ |
| `e2e/chaos/error-boundary.spec.ts` | サーバーエラー | error.tsx表示、Try again復帰、Server Action toast |

### 構成

- `playwright.config.ts` - Playwright設定（Chromiumのみ、workers:1）
- `e2e/fixtures/auth.setup.ts` - Auth0認証セットアップ
- `e2e/helpers/cdp-network.ts` - CDPネットワーク条件プリセット（slow3G, offline, fast）
- `e2e/helpers/selectors.ts` - 共有セレクタ・ルート定数
