# Issue: Storybook 10 推奨設定・プラグイン導入

## Metadata

| Field | Value |
|-------|-------|
| **Category** | DX / Testing |
| **Priority** | MEDIUM |
| **Check Item** | Storybook 10 新機能活用・設定最適化 |
| **Affected File** | `.storybook/main.ts`, `.storybook/preview.tsx`, `.storybook/vitest.setup.ts`, `package.json`, `vitest.config.ts`, `*.stories.tsx` (49ファイル) |

## Problem Description

現在Storybook 10.2.1で基本設定は整っているが、SB10の新機能（CSF Factories, sb.mock()）が未活用など改善余地がある。SB10の推奨パターンに合わせた設定最適化と、開発体験・テスト品質の向上を目的とする。

### Issues

1. CSF3形式で `Meta`/`StoryObj` 型importや `satisfies` ボイラープレートが残存
2. Tags ベースのストーリーフィルタリングが未活用

## Recommendation

### 1. main.ts を defineMain に移行（CSF Factories対応）

```typescript
// Before
import type { StorybookConfig } from "@storybook/nextjs-vite";
const config: StorybookConfig = { ... };
export default config;

// After
import { defineMain } from "@storybook/nextjs-vite/node";
export default defineMain({ ... });
```

### 2. preview.tsx を definePreview に移行（CSF Factories対応）

```typescript
// Before
import type { Preview } from "@storybook/nextjs-vite";
const preview = { ... } satisfies Preview;
export default preview;

// After
import { definePreview } from "@storybook/nextjs-vite";
export default definePreview({ ... });
```

### 3. CSF Factories ストーリー移行（49ファイル）

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

### 4. Tags ベースフィルタリング

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

### 5. vitest.setup.ts（変更なし）

`vi.mock` は維持する。`sb.mock()` はStorybook UIのビルドパイプライン用であり、vitest-storybookテストランナーでは `vi.mock` が依然として必要。

## Implementation Steps

1. [ ] `.storybook/main.ts` を `defineMain` に更新
2. [ ] `.storybook/preview.tsx` を `definePreview` に更新
3. [ ] `package.json` に subpath imports 追加
4. [ ] CSF Factories 自動マイグレーション実行（49ファイル）
5. [ ] Tags フィルタリング設定
6. [ ] Storybook起動・テスト実行・ビルド確認

## 実装順序とリスク

| 順序 | ステップ | リスク |
|------|----------|--------|
| 1 | main.ts 更新 | 低 |
| 2 | preview.tsx 更新 | 低 |
| 3 | subpath imports 追加 | 低 |
| 4 | CSF Factories 自動マイグレーション | 中（49ファイル対象） |
| 5 | Tags 適用 | 低 |

## References

- [Storybook CSF Factories](https://storybook.js.org/docs/api/csf/csf-next)
- [Storybook a11y Testing](https://storybook.js.org/docs/writing-tests/accessibility-testing)
