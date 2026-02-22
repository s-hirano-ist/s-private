# Issue: Stryker Mutator によるミューテーションテスト導入

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Quality / Testing |
| **Priority** | MEDIUM |
| **Check Item** | テスト品質の定量評価（Mutation Score） |
| **Affected File** | `vitest.config.ts`, `package.json`, `packages/core/` |

## Problem Description

Vitest によるユニットテストとカバレッジ計測（`@vitest/coverage-v8`）は整備済みだが、カバレッジ率だけではテストの品質（バグ検出力）を評価できない。

具体的な課題:
1. カバレッジ100%でもアサーションが甘いテストは見逃しが多い
2. ドメイン層（`packages/core/`）のビジネスロジックに対するテストの網羅性が未検証
3. 条件分岐やエッジケースの見落としを自動検出する仕組みがない

ミューテーションテストは、コードに意図的な変異（mutation）を加え、テストがその変異を検出できるかを検証することで、テストの真の品質を計測する。

## Recommendation

**Stryker Mutator** の Vitest ランナー（`@stryker-mutator/vitest-runner`）を導入し、ドメイン層を中心にMutation Scoreを計測する。

### Suggested Fix

#### 1. Stryker のインストール

```bash
pnpm add -Dw @stryker-mutator/core @stryker-mutator/vitest-runner @stryker-mutator/typescript-checker
```

#### 2. Stryker 設定ファイル

```json
// stryker.config.json
{
  "$schema": "https://raw.githubusercontent.com/stryker-mutator/stryker/master/packages/core/schema/stryker-schema.json",
  "testRunner": "vitest",
  "vitest": {
    "configFile": "vitest.config.ts",
    "project": "core"
  },
  "checkers": ["typescript"],
  "tsconfigFile": "packages/core/tsconfig.json",
  "mutate": [
    "packages/core/src/**/*.ts",
    "!packages/core/src/**/*.test.ts",
    "!packages/core/src/**/*.spec.ts"
  ],
  "reporters": ["html", "clear-text", "progress"],
  "thresholds": {
    "high": 80,
    "low": 60,
    "break": 50
  },
  "concurrency": 4,
  "timeoutMS": 60000
}
```

#### 3. ドメイン層の重点テスト対象

```json
// stryker.config.core.json - ドメイン層にフォーカス
{
  "mutate": [
    "packages/core/src/entities/**/*.ts",
    "packages/core/src/services/**/*.ts",
    "packages/core/src/shared-kernel/**/*.ts",
    "!packages/core/src/**/*.test.ts"
  ]
}
```

対象となるビジネスロジックの例:
- エンティティのバリデーションロジック（articles, notes, books, images）
- 状態遷移ロジック（UNEXPORTED → EXPORTED）
- 共有カーネルのユーティリティ関数

#### 4. npm script の追加

```json
{
  "scripts": {
    "test:mutation": "stryker run",
    "test:mutation:core": "stryker run --configFile stryker.config.core.json"
  }
}
```

#### 5. CI統合（GitHub Actions）

```yaml
# .github/workflows/mutation-test.yml
name: Mutation Testing
on:
  pull_request:
    paths:
      - "packages/core/src/**"

jobs:
  stryker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:mutation:core
      - uses: actions/upload-artifact@v4
        with:
          name: mutation-report
          path: reports/mutation/
```

## Implementation Steps

1. [ ] `@stryker-mutator/core`, `@stryker-mutator/vitest-runner`, `@stryker-mutator/typescript-checker` をインストール
2. [ ] `stryker.config.json` を作成（ドメイン層対象）
3. [ ] ローカルで `pnpm test:mutation:core` を実行し、初回のMutation Scoreを計測
4. [ ] Mutation Score が低い箇所のテストを強化
5. [ ] CI ワークフローに組み込み、`packages/core/` 変更時に自動実行
6. [ ] `thresholds.break` を段階的に引き上げ（50 → 60 → 70）
