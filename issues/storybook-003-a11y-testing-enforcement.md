# Issue: Storybook a11y テストのCI強制とカバレッジ向上

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Quality / Accessibility |
| **Priority** | HIGH |
| **Check Item** | アクセシビリティ違反の自動検知・CI統合 |
| **Affected File** | `.storybook/preview.tsx`, `.storybook/vitest.setup.ts`, `vitest.config.ts` |

## Problem Description

`@storybook/addon-a11y@10.2.8` がインストール済みで、`preview.tsx` に `a11y: { test: "error" }` が設定されており、Storybook UI上ではa11y違反がエラーとして表示される。また `.storybook/vitest.setup.ts` で `setProjectAnnotations` により a11y annotations が適用されている。

しかし以下の課題がある:

1. **CIでの強制がない**: `pnpm test` 実行時にa11y違反がテスト失敗として扱われているか未確認
2. **axe-coreルールのカスタマイズが未設定**: プロジェクト固有の要件（日本語コンテンツのlang属性、色コントラスト等）に対応していない
3. **a11yテストカバレッジの可視化がない**: どのコンポーネントがa11yテスト済みか把握できない
4. **49ファイルのストーリー全てでa11yが検証されているか不明**

### Current Configuration

```typescript
// .storybook/preview.tsx
parameters: {
  a11y: {
    test: "error", // a11y違反をエラーとして扱う
  },
}

// .storybook/vitest.setup.ts
import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
const annotations = setProjectAnnotations([
  a11yAddonAnnotations,
  // ...
]);
```

## Recommendation

既存のa11y設定を活かし、CIでの強制実行、axe-coreルールのカスタマイズ、カバレッジ向上を段階的に実施する。

### Suggested Fix

#### 1. a11yテストがCI上で機能していることの確認

```bash
# Storybookのvitestテストでa11y違反がエラーになることを確認
pnpm vitest run --project storybook
```

`a11y: { test: "error" }` 設定により、`@storybook/addon-vitest` 経由のテスト実行時にaxe-coreが自動実行され、違反があればテスト失敗となるはず。CIワークフローで `pnpm test` に `--project storybook` が含まれていることを確認する。

#### 2. axe-core ルールのカスタマイズ

```typescript
// .storybook/preview.tsx
parameters: {
  a11y: {
    test: "error",
    options: {
      rules: [
        // 日本語コンテンツのlang属性チェックを強化
        { id: "html-has-lang", enabled: true },
        { id: "html-lang-valid", enabled: true },
        // 色コントラスト比チェック（WCAG AA準拠）
        { id: "color-contrast", enabled: true },
        // 画像のalt属性チェック
        { id: "image-alt", enabled: true },
        // フォーム要素のラベルチェック
        { id: "label", enabled: true },
        // ランドマークの重複チェック
        { id: "landmark-unique", enabled: true },
      ],
    },
    config: {
      // axe-core の実行対象をコンポーネントルートに限定
      rules: [
        {
          id: "region",
          // Storybook内ではlandmark region外でもOK
          enabled: false,
        },
      ],
    },
  },
}
```

#### 3. ストーリー単位でのa11y設定オーバーライド

```tsx
// 特定のストーリーでルールを一時的に無効化する例（正当な理由がある場合のみ）
export const DecorativeImage = meta.story({
  args: { src: "/decorative.png", alt: "" }, // 装飾画像はalt=""が正しい
  parameters: {
    a11y: {
      options: {
        rules: [
          { id: "image-alt", enabled: false }, // 装飾画像のため除外
        ],
      },
    },
  },
});
```

#### 4. a11y テスト用 Tags の活用

```typescript
// .storybook/preview.tsx
tags: ["autodocs", "a11y-test"], // 全ストーリーにa11yタグを付与

// 特定ストーリーでa11yテストを除外する場合
export const AnimationOnly = meta.story({
  tags: ["!a11y-test"],
  // ...
});
```

#### 5. CI ワークフローでの明示的な a11y テスト実行

```yaml
# .github/workflows/a11y.yml（または既存CIに統合）
name: Accessibility Tests
on:
  pull_request:
    paths:
      - "app/src/components/**"
      - "packages/ui/src/**"
      - "**/*.stories.tsx"

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm vitest run --project storybook
        env:
          CI: true
```

#### 6. a11yカバレッジの可視化

```bash
# ストーリーファイルの数とa11yテスト対象の確認
# 全49ストーリーファイルがstorybook projectに含まれていることを確認
pnpm vitest run --project storybook --reporter=verbose 2>&1 | grep -c "a11y"
```

## Implementation Steps

1. [ ] `pnpm vitest run --project storybook` でa11y違反がテスト失敗になることをローカルで確認
2. [ ] `.storybook/preview.tsx` の `a11y.options.rules` にプロジェクト固有のルールを追加
3. [ ] 不要な `region` ルール等をStorybook環境用に無効化
4. [ ] 既存49ストーリーファイルでa11y違反が出ているものを特定・修正
5. [ ] CIワークフローに `--project storybook` を含むテストジョブを追加（既存CIに統合可）
6. [ ] a11y違反の修正後、全ストーリーがパスすることを確認
7. [ ] 新規コンポーネント追加時のa11yテスト必須化をチーム内で合意
