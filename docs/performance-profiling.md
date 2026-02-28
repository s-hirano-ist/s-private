# Performance Profiling

React Compiler (`reactCompiler: true`) が有効な環境で、コンポーネントレベルのレンダリングコストを計測するためのツールとワークフロー。

## ProfilerWrapper

`@s-hirano-ist/s-ui/dev/profiler-wrapper` が提供する開発専用の `<Profiler>` ラッパー。

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | (必須) | Profiler の識別子 |
| `threshold` | `number` | `16` | 警告閾値 (ms)。超過時に `console.warn` を出力 |
| `onCollect` | `(result: ProfilerResult) => void` | - | プログラマティックにデータを収集するコールバック |
| `children` | `React.ReactNode` | (必須) | 計測対象のコンポーネント |

### Production での挙動

`process.env.NODE_ENV !== "development"` の場合、`children` をそのまま返しオーバーヘッドゼロ。

### 使用例

```tsx
import { ProfilerWrapper } from "@s-hirano-ist/s-ui/dev/profiler-wrapper";

<ProfilerWrapper id="MyComponent" threshold={10}>
  <MyComponent />
</ProfilerWrapper>
```

### 適用済みコンポーネント

| コンポーネント | ID | ファイル |
|----------------|-----|---------|
| `BaseCardStackWrapper` | `BaseCardStack` | `app/src/components/common/layouts/cards/base-card-stack.tsx` |

## ベンチマークコマンド

```bash
# packages 内のベンチマーク（Node 環境）
pnpm bench

# コンポーネントベンチマーク（jsdom 環境）
pnpm bench:components

# 全ベンチマーク実行
pnpm bench:all
```

## ブラウザでのプロファイリング

### Chrome DevTools

1. `pnpm dev` で開発サーバー起動
2. Chrome DevTools → Performance タブ → Record
3. 対象ページで操作を実行
4. Recording 停止後、Timings セクションで React のレンダリングを確認

### React DevTools Profiler

1. React DevTools 拡張をインストール
2. Profiler タブ → Start profiling
3. 操作実行後 Stop
4. Flamegraph / Ranked で各コンポーネントの render 時間を確認

## React Compiler 比較

`next.config.mjs` で `reactCompiler` を一時的に無効化して比較可能：

```js
// next.config.mjs
experimental: {
  reactCompiler: false, // 一時的に無効化
}
```

### 注意事項

- Vitest の jsdom 環境では React Compiler は適用されない（babel transform が走らないため）
- 正確な React Compiler 有効/無効の比較はブラウザ上の DevTools Profiler で行うこと
- ベンチマーク結果はコンポーネントの相対的なコストの把握に使用する
