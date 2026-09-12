# UIパッケージのビルドをtsupからtsdownへ移行する

## Metadata

| Field | Value |
| --- | --- |
| Category | Refactor / Build |
| Priority | HIGH |
| Status | 未着手 |

## 理由

tsupは[公式README](https://github.com/egoist/tsup)で積極的な保守終了とtsdownへの移行を案内している。
現行8.5.1はnpm deprecated指定がないが維持推奨にはしない。
esbuild@0.27.7の監査検出もある。速度改善は未計測。

## 変更方針

- `packages/ui/tsup.config.ts`とscriptsをtsdownへ移行。調査時候補は0.23.0、実装時に公式情報を再確認。
- ESM、ES2025、複数entry、stories/test除外、code splitting、sourcemap、外部React依存を明示。
- `use client`の必要なentryへの保持を確認する。全ファイルへの一律付与はしない。
- 型生成は`tsc -p tsconfig.build.json`を維持し、tsdownのdts生成を重ねて実行しない。
- watch時のclean、CSS成果物、subpath exportsと公開ファイル構成を確認。
  内部chunk名の後方互換は求めない。
- Node 24.19.0は候補版の要件を満たすが、宣言`>=24`は24.0も許容してしまう。
  開発・CIに必要な24.11以上の下限を関連ドキュメントへ明記する。
- [移行ガイド](https://tsdown.dev/guide/migrate-from-tsup)と[React対応](https://tsdown.dev/recipes/react-support)を参照。
  新しい設計判断はdocsへ追記。双方MIT、追加SaaSなし。

## 完了条件・検証

- [ ] UIに着手する前にStorybook MCPの指示を取得。
- [ ] `pnpm check:agent`、`pnpm build`。
- [ ] `pnpm --filter @s-hirano-ist/s-ui test:consumer`。
- [ ] `pnpm --filter @s-hirano-ist/s-ui validate:package`。
- [ ] `pnpm storybook:ui:build`、`pnpm storybook:ui:test`。
- [ ] clean build/watch再buildでJS・型・CSSが揃うことを確認。
- [ ] build時間と出力容量を同一条件で比較し、未測定の高速化を主張しない。
- [ ] audit/whyでtsup経路が消えたことを確認し、完了後に本issueを削除。
