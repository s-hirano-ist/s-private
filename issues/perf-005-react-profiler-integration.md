# Issue: React Profiler / DevTools Profiler によるパフォーマンス計測ワークフロー整備

## Metadata

| Field | Value |
|-------|-------|
| **Category** | Performance |
| **Priority** | MEDIUM |
| **Check Item** | レンダリングボトルネックの計測・可視化 |
| **Affected File** | `app/src/components/`, `vitest.config.ts` |

## Problem Description

React Compiler が有効化済み（`reactCompiler: true`）で自動メモ化が機能しているが、実際のレンダリングコストを定量的に計測する仕組みがない。Vitest bench によるマイクロベンチマークは `packages/search/src/chunker.bench.ts` 等で実施されているが、コンポーネントレベルのレンダリングパフォーマンス計測は未整備。

具体的な課題:
1. どのコンポーネントがレンダリングボトルネックになっているか把握できない
2. React Compiler の最適化効果を定量的に検証する手段がない
3. 開発時のプロファイリング手順が標準化されていない

## Recommendation

React の `<Profiler>` API を活用したコンポーネントレベルの計測ユーティリティを整備し、開発時のプロファイリングワークフローを標準化する。

### Suggested Fix

#### 1. 開発用 Profiler ラッパーの作成

```tsx
// packages/ui/src/components/dev/profiler-wrapper.tsx
"use client";

import { type ProfilerOnRenderCallback, Profiler } from "react";

const onRenderCallback: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime,
) => {
  if (actualDuration > 16) {
    // 1フレーム（16ms）を超える場合に警告
    console.warn(
      `[Profiler] ${id} (${phase}): ${actualDuration.toFixed(2)}ms (base: ${baseDuration.toFixed(2)}ms)`,
    );
  }
};

export function ProfilerWrapper({
  id,
  children,
}: { id: string; children: React.ReactNode }) {
  if (process.env.NODE_ENV !== "development") {
    return <>{children}</>;
  }
  return (
    <Profiler id={id} onRender={onRenderCallback}>
      {children}
    </Profiler>
  );
}
```

#### 2. Vitest bench によるコンポーネントレンダリングベンチマーク

```tsx
// app/src/components/__bench__/heavy-component.bench.tsx
import { cleanup, render } from "@testing-library/react";
import { bench, describe } from "vitest";

describe("HeavyComponent rendering", () => {
  bench("initial render", () => {
    const { unmount } = render(<HeavyComponent items={mockItems} />);
    unmount();
  });

  bench("re-render with updated props", () => {
    const { rerender, unmount } = render(
      <HeavyComponent items={mockItems} />,
    );
    rerender(<HeavyComponent items={updatedItems} />);
    unmount();
  });
});
```

#### 3. Chrome DevTools Profiler 活用手順のドキュメント化

開発ガイドとして以下の手順を整備:
- `pnpm dev` で開発サーバー起動（React Profiler はデフォルトで有効）
- Chrome DevTools → Performance タブで録画
- React DevTools → Profiler タブでコンポーネント単位の計測
- 「Highlight updates when components render」を有効化

## Implementation Steps

1. [ ] `packages/ui/src/components/dev/profiler-wrapper.tsx` を作成
2. [ ] 描画コストの高いページ（articles一覧等）に `ProfilerWrapper` を試験適用
3. [ ] コンポーネントレンダリングベンチマークのサンプルを作成し、`vitest bench` プロジェクトに追加
4. [ ] プロファイリングワークフロー手順を `docs/` に記載
5. [ ] React Compiler 有効/無効時のレンダリングコスト比較を実施
