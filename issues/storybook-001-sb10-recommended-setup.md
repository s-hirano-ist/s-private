# Issue: Storybook 10 推奨設定・プラグイン導入

## Metadata

| Field | Value |
|-------|-------|
| **Category** | DX / Testing |
| **Priority** | MEDIUM |
| **Check Item** | Storybook 10 新機能活用・設定最適化 |
| **Affected File** | `.storybook/main.ts`, `.storybook/preview.tsx`, `.storybook/vitest.setup.ts`, `package.json`, `vitest.config.ts`, `*.stories.tsx` (49ファイル) |

## Problem Description

現在Storybook 10.2.1で基本設定は整っているが、SB10の新機能（CSF Factories, sb.mock()）が未活用、未使用アドオンの残存、MSW未導入、a11y未強制など改善余地がある。SB10の推奨パターンに合わせた設定最適化と、開発体験・テスト品質の向上を目的とする。

### Issues

1. `@storybook/addon-links` が全49ストーリーで未使用（import 0件）
2. MSW未導入のためAPIモックがストーリー内で統一されていない
3. a11y テストが `"todo"` のままでCI強制されていない
4. CSF3形式で `Meta`/`StoryObj` 型importや `satisfies` ボイラープレートが残存
5. Tags ベースのストーリーフィルタリングが未活用

## Recommendation

### 1. addon-links 削除

```bash
pnpm remove -w @storybook/addon-links
```

`.storybook/main.ts` の addons 配列から `"@storybook/addon-links"` を削除。

### 2. MSW 導入

```bash
pnpm add -Dw msw msw-storybook-addon
npx msw init app/public --save
```

- `app/public/mockServiceWorker.js` が生成される
- `staticDirs: ["../app/public"]` 設定済みのため自動配信される

`.storybook/main.ts` の addons に `"msw-storybook-addon"` を追加。

`.storybook/preview.tsx` に以下を追加:
```tsx
import { initialize, mswLoader } from "msw-storybook-addon";
initialize();
// definePreview/preview内に:
loaders: [mswLoader],
parameters: { msw: { handlers } },
```

MSWハンドラーファイルを新規作成:
- `.storybook/mocks/handlers.ts`
- `.storybook/mocks/handlers/images.ts`（画像APIのデフォルトモック: 1x1透明PNG）

### 3. main.ts を defineMain に移行（CSF Factories対応）

```typescript
// Before
import type { StorybookConfig } from "@storybook/nextjs-vite";
const config: StorybookConfig = { ... };
export default config;

// After
import { defineMain } from "@storybook/nextjs-vite/node";
export default defineMain({ ... });
```

### 4. preview.tsx を definePreview に移行（CSF Factories対応）

```typescript
// Before
import type { Preview } from "@storybook/nextjs-vite";
const preview = { ... } satisfies Preview;
export default preview;

// After
import { definePreview } from "@storybook/nextjs-vite";
export default definePreview({ ... });
```

### 5. a11y テスト強制化

```typescript
// preview.tsx parameters内
a11y: { test: "error" },  // "todo" → "error"
```

注意: 既存ストーリーでa11y違反がある場合テスト失敗する。即座に修正できない場合、該当ストーリーに `a11y: { test: "todo" }` を個別設定して段階的に修正。

### 6. CSF Factories ストーリー移行（49ファイル）

`package.json` に subpath imports を追加:
```json
{
  "imports": {
    "#.storybook/*": ["./.storybook/*"]
  }
}
```

自動マイグレーション:
```bash
npx storybook automigrate csf-factories
```

変換パターン:
```tsx
// Before (CSF3)
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
const meta = { component: Button } satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: { children: "ボタン" } };

// After (CSF Factories)
import preview from "#.storybook/preview";
const meta = preview.meta({ component: Button });
export default meta;
export const Default = meta.story({ args: { children: "ボタン" } });
```

注意: 自動マイグレーションはインタラクティブプロンプトがあるため、TTYが必要。subpath imports を選択する。

### 7. Tags ベースフィルタリング

| タグ | 用途 | 適用例 |
|------|------|--------|
| `!test` | vitestテストから除外 | ビジュアル確認のみのストーリー |
| `!autodocs` | ドキュメントから除外 | デバッグ用ストーリー |
| `dev-only` | 開発時のみ表示 | 内部確認用ストーリー |

`vitest.config.ts` のstorybookTestに tags設定追加:
```typescript
storybookTest({
  tags: { exclude: ["dev-only"] },
}),
```

### 8. vitest.setup.ts（変更なし）

`vi.mock` は維持する。`sb.mock()` はStorybook UIのビルドパイプライン用であり、vitest-storybookテストランナーでは `vi.mock` が依然として必要。

## Implementation Steps

1. [ ] `@storybook/addon-links` を削除
2. [ ] `msw` + `msw-storybook-addon` をインストール、Service Worker生成
3. [ ] `.storybook/main.ts` を `defineMain` に更新、addon変更
4. [ ] `.storybook/preview.tsx` を `definePreview` に更新、MSW・a11y設定
5. [ ] `.storybook/mocks/` ハンドラーファイル作成
6. [ ] `package.json` に subpath imports 追加
7. [ ] CSF Factories 自動マイグレーション実行（49ファイル）
8. [ ] Tags フィルタリング設定
9. [ ] Storybook起動・テスト実行・ビルド確認

## 実装順序とリスク

| 順序 | ステップ | リスク |
|------|----------|--------|
| 1 | addon-links 削除 | なし（未使用） |
| 2 | MSW インストール + Service Worker 生成 | 低 |
| 3 | main.ts 更新 | 低 |
| 4 | preview.tsx 更新 | 中（a11y error化でテスト失敗の可能性） |
| 5 | MSW ハンドラー作成 | 低 |
| 6 | subpath imports 追加 | 低 |
| 7 | CSF Factories 自動マイグレーション | 中（49ファイル対象） |
| 8 | Tags 適用 | 低 |

## References

- [Storybook CSF Factories](https://storybook.js.org/docs/api/csf/csf-next)
- [MSW Storybook Addon](https://github.com/mswjs/msw-storybook-addon)
- [Storybook a11y Testing](https://storybook.js.org/docs/writing-tests/accessibility-testing)
