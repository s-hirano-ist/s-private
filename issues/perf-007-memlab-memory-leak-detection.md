# Issue: memlab によるメモリリーク自動検知の導入

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Performance |
| **Priority** | LOW |
| **Check Item** | メモリリークの自動検知・CI統合 |
| **Affected File** | `package.json`, CI設定 |

## Problem Description

SPAライクなナビゲーション（App Router の Client Router Cache）を多用しており、以下のメモリリークリスクがある:

1. クライアントコンポーネントでの `useEffect` クリーンアップ漏れ（イベントリスナー、タイマー等）
2. Drawer/Dialog 等のUI要素開閉時のDOM参照リーク
3. React Compiler の自動メモ化によりキャッシュされたオブジェクトの意図しない保持
4. `sonner` トースト通知の大量表示時のメモリ蓄積

現状、メモリリークを検知する自動テストが存在せず、本番環境での長時間利用時にのみ顕在化する可能性がある。

## Recommendation

Meta社のOSS **memlab** を導入し、Puppeteerベースのヒープスナップショット自動比較によるメモリリーク検知をCIに組み込む。

### Suggested Fix

#### 1. memlab のインストール

```bash
pnpm add -Dw memlab @aspect-build/rules_js
```

#### 2. テストシナリオの定義

```typescript
// memlab/scenarios/article-list-navigation.ts
import { type IScenario } from "@aspect-build/rules_js";

const scenario: IScenario = {
  url: () => "http://localhost:3000/ja/main/articles",

  // ステップ1: 記事一覧から記事詳細に遷移
  action: async (page) => {
    const firstArticle = await page.waitForSelector(
      '[data-testid="article-card"]:first-child a',
    );
    await firstArticle?.click();
    await page.waitForNavigation({ waitUntil: "networkidle0" });
  },

  // ステップ2: 記事一覧に戻る
  back: async (page) => {
    await page.goBack();
    await page.waitForNavigation({ waitUntil: "networkidle0" });
  },
};

export default scenario;
```

```typescript
// memlab/scenarios/drawer-open-close.ts
import { type IScenario } from "@aspect-build/rules_js";

const scenario: IScenario = {
  url: () => "http://localhost:3000/ja/main/articles",

  action: async (page) => {
    // Drawer を開く
    const menuButton = await page.waitForSelector(
      '[data-testid="menu-trigger"]',
    );
    await menuButton?.click();
    await page.waitForSelector('[role="dialog"]');
  },

  back: async (page) => {
    // Drawer を閉じる
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => !document.querySelector('[role="dialog"]'),
    );
  },
};

export default scenario;
```

#### 3. npm script の追加

```json
{
  "scripts": {
    "memlab:article": "memlab run --scenario memlab/scenarios/article-list-navigation.ts",
    "memlab:drawer": "memlab run --scenario memlab/scenarios/drawer-open-close.ts",
    "memlab:all": "pnpm memlab:article && pnpm memlab:drawer"
  }
}
```

#### 4. CI統合（GitHub Actions）

```yaml
# .github/workflows/memlab.yml
name: Memory Leak Detection
on:
  pull_request:
    paths:
      - "app/src/components/**"
      - "packages/ui/**"

jobs:
  memlab:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter s-private-app build
      - run: pnpm --filter s-private-app start &
      - run: npx wait-on http://localhost:3000
      - run: pnpm memlab:all
```

## Implementation Steps

1. [ ] `memlab` パッケージのインストールと初期設定
2. [ ] 記事一覧ナビゲーションシナリオの作成
3. [ ] Drawer/Dialog 開閉シナリオの作成
4. [ ] ローカルで memlab シナリオを実行し、ベースラインを確認
5. [ ] GitHub Actions ワークフローを追加
6. [ ] 検知されたリークの修正（発見された場合）
