# Issue: Chaos Frontend Toolkit によるフロントエンドレジリエンステスト

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Quality / Resilience |
| **Priority** | LOW |
| **Check Item** | ネットワーク劣化・障害時のUI耐障害性検証 |
| **Affected File** | `app/src/app/error.tsx`, `app/src/app/global-error.tsx`, Server Actions |

## Problem Description

エラーバウンダリ（`error.tsx`, `global-error.tsx`, `error-permission-boundary.tsx`）やSentryによるエラー監視は整備されているが、以下の障害シナリオに対する耐性が未検証:

1. **ネットワーク劣化**: 3G回線相当の低速環境でのUI応答性
2. **ネットワーク切断**: オフライン時のServer Action失敗ハンドリング
3. **サーバー遅延**: API応答が遅い場合のローディングUI・タイムアウト処理
4. **ランダムエラー注入**: 予期しないエラー発生時のグレースフルデグラデーション

管理者向けCMSとはいえ、不安定なネットワーク環境での利用も想定すべきであり、`wrapServerSideErrorForClient` によるエラーハンドリングが実際の障害時に正しく機能するか検証が必要。

## Recommendation

**Chaos Frontend Toolkit**（またはブラウザDevToolsのNetwork Throttling）を活用したレジリエンステストを整備する。

### Suggested Fix

#### 1. Chaos Frontend Toolkit のインストール

```bash
pnpm add -Dw chaos-frontend-toolkit
```

#### 2. テストシナリオ: ネットワーク遅延シミュレーション

```typescript
// e2e/chaos/network-delay.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Network resilience", () => {
  test("Server Action handles slow network gracefully", async ({ page, context }) => {
    // 3G相当のネットワーク遅延をシミュレート
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      downloadThroughput: (500 * 1024) / 8, // 500kbps
      uploadThroughput: (500 * 1024) / 8,
      latency: 400, // 400ms遅延
    });

    await page.goto("/ja/main/articles");

    // ローディングUIが表示されること
    // Server Actionが最終的に成功すること
    await expect(page.getByRole("main")).toBeVisible({ timeout: 30000 });
  });

  test("UI shows error state when network is offline", async ({ page, context }) => {
    await page.goto("/ja/main/articles");

    // ネットワークを切断
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.emulateNetworkConditions", {
      offline: true,
      downloadThroughput: 0,
      uploadThroughput: 0,
      latency: 0,
    });

    // Server Action を実行するUI操作
    // エラーUIが表示されること
    // ネットワーク復帰後にリトライ可能であること
  });
});
```

#### 3. テストシナリオ: エラーバウンダリの検証

```typescript
// e2e/chaos/error-boundary.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Error boundary resilience", () => {
  test("error.tsx catches and displays error UI", async ({ page }) => {
    // サーバーサイドでエラーを発生させるルートにアクセス
    await page.goto("/ja/main/articles");

    // JavaScriptエラーを注入
    await page.evaluate(() => {
      throw new Error("Simulated client-side error");
    });

    // error.tsx のUIが表示されること
    // "Try again" ボタンが機能すること
  });

  test("Server Action error is handled by wrapServerSideErrorForClient", async ({ page }) => {
    // APIレスポンスを500エラーにモック
    await page.route("**/api/**", (route) =>
      route.fulfill({ status: 500, body: "Internal Server Error" }),
    );

    await page.goto("/ja/main/articles");
    // エラートーストまたはエラーUIが適切に表示されること
  });
});
```

#### 4. npm script の追加

```json
{
  "scripts": {
    "test:chaos": "playwright test e2e/chaos/"
  }
}
```

## Implementation Steps

1. [ ] Playwright テストディレクトリに `e2e/chaos/` を作成
2. [ ] ネットワーク遅延シミュレーションテストを実装
3. [ ] ネットワーク切断テストを実装
4. [ ] エラーバウンダリ検証テストを実装
5. [ ] 各テストを実行し、発見された問題を修正
6. [ ] `wrapServerSideErrorForClient` のオフライン時動作を検証・改善
7. [ ] テスト結果を基にローディングUI・リトライUIの改善が必要か判断
