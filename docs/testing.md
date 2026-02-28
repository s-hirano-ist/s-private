# Testing

## Commands

- `pnpm test` - Run all Vitest unit tests (workspace-wide)
- `pnpm test:typecheck` - Run TypeScript type checking on test files only
- `pnpm test:all` - Run all unit tests and type checking

## Vitest Workspace Configuration

The project uses Vitest workspace to manage tests across multiple packages:
- **Workspace Root**: `vitest.config.ts` defines three test projects (app, ui, core)
- **Individual Configs**: Each package has its own `vitest.config.ts` with specific settings
- **Unified Execution**: Run all tests from the root with `pnpm test`

## Test Setup per Package

### app
- **Environment**: jsdom with Next.js-specific mocks (auth, prisma, minio, env)
- **Config**: [app/vitest.config.ts](../app/vitest.config.ts)
- **Setup**: [app/vitest-setup.tsx](../app/vitest-setup.tsx)
- **Features**: Includes Storybook integration with browser testing

### packages/ui
- **Environment**: jsdom for React component testing
- **Config**: [packages/ui/vitest.config.ts](../packages/ui/vitest.config.ts)
- **Setup**: [packages/ui/vitest-setup.tsx](../packages/ui/vitest-setup.tsx)

### packages/core
- **Environment**: Node for domain logic testing
- **Config**: [packages/core/vitest.config.ts](../packages/core/vitest.config.ts)
- **Setup**: [packages/core/vitest-setup.tsx](../packages/core/vitest-setup.tsx)

## Technologies

- **Test Framework**: Vitest with `@testing-library/react` for component tests
- **Coverage**: `@vitest/coverage-v8` enabled for all packages
- **Type Checking**: TypeScript type checking enabled in tests
- **Storybook**: Component testing with coverage support and Playwright browser testing

## Component Benchmarks

Vitest bench によるコンポーネントレンダリングのベンチマーク。

```bash
pnpm bench:components   # コンポーネントベンチマークのみ
pnpm bench:all          # 全ベンチマーク（packages + components）
```

詳細は [performance-profiling.md](./performance-profiling.md) を参照。

## Storybook Accessibility Testing

Storybookの全ストーリーに対して axe-core ベースのa11yテストを自動実行する。

### 仕組み

- `@storybook/addon-a11y` がインストール済み
- `.storybook/preview.tsx` で `a11y: { test: "error" }` を設定 → a11y違反時にテスト失敗
- `.storybook/vitest.setup.ts` で `@storybook/addon-a11y/preview` の annotations を適用
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

## memlab メモリリーク検知

[memlab](https://facebook.github.io/memlab/) によるPuppeteerベースのヒープスナップショット比較でメモリリークを自動検知する。

### 前提条件

- アプリケーションが `http://localhost:3000` で起動済みであること
- 認証壁があるため、ログイン済みのセッションが必要

### コマンド

```bash
pnpm memlab:article   # 記事タブ間ナビゲーションシナリオ
pnpm memlab:drawer    # SearchDrawer開閉シナリオ
pnpm memlab:all       # 全シナリオ実行
```

### シナリオ

| シナリオ | ファイル | 検知対象 |
|---------|---------|---------|
| 記事ナビゲーション | `memlab/scenarios/article-list-navigation.ts` | IntersectionObserverリーク |
| Drawer開閉 | `memlab/scenarios/drawer-open-close.ts` | DOM参照リーク |

### CI統合

GitHub Actionsの `memlab.yaml` ワークフローで `workflow_dispatch` トリガーにより手動実行可能。結果はartifactとしてアップロードされる。
