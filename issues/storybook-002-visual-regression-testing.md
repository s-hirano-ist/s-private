# Issue: Chromatic によるビジュアルリグレッションテストの本格運用

※ https://zenn.dev/knowledgework/articles/297ccfb866a5b5 等も参考に再計画が必要

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Quality / Visual Testing |
| **Priority** | HIGH |
| **Check Item** | UIの意図しない見た目変更の自動検知 |
| **Affected File** | `.storybook/main.ts`, `.github/workflows/`, `package.json` |

## Problem Description

`@chromatic-com/storybook@5.0.1` がインストール済みでStorybook addonとして登録されているが、Chromatic のCI連携が未設定のため、ビジュアルリグレッションテストが自動実行されていない。

現状の課題:
1. UIコンポーネント変更時にビジュアルリグレッションが検知されない
2. Storybookの49ファイルのストーリーがビジュアルテストのベースラインとして活用されていない
3. テーマ（light/dark）やビューポート切り替え時の見た目の不整合が見落とされる
4. PRレビュー時にUIの変更差分を視覚的に確認する手段がない

### Current Configuration

```typescript
// .storybook/main.ts
addons: [
  "@chromatic-com/storybook",  // インストール済み・未運用
  "@storybook/addon-a11y",
  // ...
]
```

## Recommendation

Chromatic のCI連携を設定し、PR作成時に自動でビジュアルスナップショットを取得・比較する。

### Suggested Fix

#### 1. Chromatic プロジェクトのセットアップ

```bash
# Chromatic にプロジェクトを登録（初回のみ）
npx chromatic --project-token=<CHROMATIC_PROJECT_TOKEN>
```

#### 2. GitHub Actions ワークフロー

```yaml
# .github/workflows/chromatic.yml
name: Chromatic Visual Tests
on:
  pull_request:
    paths:
      - "app/src/components/**"
      - "packages/ui/src/**"
      - ".storybook/**"
      - "**/*.stories.tsx"

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Chromaticはgit履歴が必要
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - uses: chromaui/action@latest
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          buildScriptName: storybook:build
          exitZeroOnChanges: true # 変更がある場合もCIは成功（レビューで承認）
          onlyChanged: true # 変更されたストーリーのみテスト
          externals: |
            - "packages/ui/src/**/*.css"
            - "app/src/**/*.css"
```

#### 3. Storybook パラメータの最適化

```typescript
// .storybook/preview.tsx のparametersに追加
parameters: {
  chromatic: {
    modes: {
      light: { theme: "light" },
      dark: { theme: "dark" },
    },
    viewports: [375, 768, 1280], // モバイル, タブレット, デスクトップ
  },
}
```

#### 4. コンポーネント単位でのChromatic設定

```tsx
// 特定ストーリーでスナップショット対象外にする例
export const AnimatedComponent = meta.story({
  args: { ... },
  parameters: {
    chromatic: { disableSnapshot: true }, // アニメーション系は除外
  },
});

// 遅延読み込みコンポーネントの待機設定
export const LazyLoadedComponent = meta.story({
  args: { ... },
  parameters: {
    chromatic: { delay: 500 }, // 500ms待機してからスナップショット
  },
});
```

#### 5. npm script の追加

```json
{
  "scripts": {
    "chromatic": "chromatic --exit-zero-on-changes",
    "chromatic:ci": "chromatic --auto-accept-changes main"
  }
}
```

## 代替ツールの検討

Chromatic以外にLokiによるビジュアルリグレッションテストも検討対象。

- **Loki**: オープンソースのビジュアルリグレッションテストツール。Storybookと統合可能で、Chromaticのようなサービス契約不要。
- Chromatic vs Loki の比較評価を行い、コスト・機能・CI統合の観点から最適なツールを選定する。

（元GH#1993: storybook CI 差分検知 with Loki?）

## Implementation Steps

1. [ ] Chromatic にプロジェクトを登録し、`CHROMATIC_PROJECT_TOKEN` を取得
2. [ ] GitHub Secrets に `CHROMATIC_PROJECT_TOKEN` を設定
3. [ ] `.github/workflows/chromatic.yml` を作成
4. [ ] `.storybook/preview.tsx` に Chromatic パラメータ（modes, viewports）を追加
5. [ ] 初回ビルドを実行してベースラインスナップショットを作成
6. [ ] アニメーション系ストーリーに `disableSnapshot` を設定
7. [ ] PR作成時のChromatic実行とレビューフローを確認
