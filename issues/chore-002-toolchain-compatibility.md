# TypeScript・Vitest・Vite更新の互換性条件を整理する

## Metadata

| Field | Value |
| --- | --- |
| Category | Maintenance / Toolchain |
| Priority | MEDIUM |
| Status | 上流互換性確認待ち |

## 確認済みの制約

2026-09-12のnpmメタデータとpeer検査で確認。

- 現行でもStorybook 10.6.0 → vite-plugin-storybook-nextjs → vite-tsconfig-paths 5.1.4 →
  tsconfck 3.1.6に、TypeScript `^5.0.0`に対する6.0.3のoptional peer不一致がある。
  tsconfckは`unmaintained`。
- Vitest 5.0.0に対し、Storybook addon-vitest 10.6.0はVitest 3/4を要求する。
- TypeScript 7.0.2に対し、TypeDoc 0.28.20は6.0.xまでを許容する。
- Vite 8.3.0はStorybook Next.js Vite 10.6.0 / Vitest 4.1.11のpeer範囲内。
  UIのViteは7.3.6。Next.js自体のbuildはTurbopackであり別の検証になる。
- React/DOM 19.3.0と対応型はNextのpeer範囲内だが、UI/Compiler/SSRの回帰確認が必要。

## 対応方針

- 現行tsconfck経路を先に調べ、上流が対応する親バージョン・設定で解消する。
  TypeScript全体を5へ戻す、peer無視で隠す、API互換性未確認のoverrideは採用しない。
- Vite 8は独立に比較可能。UI consumerとStorybookのbuild時間・出力・plugin互換性を測る。
- Vitest 5とTypeScript 7は制約が解消するまで現行系列を維持。
  Stryker、coverage/browser provider、TypeDoc plugin、型対応lintも含めて確認する。
- React minor更新は型と同時に独立した変更で扱う。
- 調査結果は報告書へ追記し、上流待ちの場合は再確認条件とURLを明記する。

## 検証

- [ ] `pnpm peers check --lockfile-only --json`の内容を確認（exit 0だけで判断しない）。
- [ ] 変更時は`pnpm check:agent`、`pnpm build`、`pnpm docs:build`。
- [ ] Stryker checker/runnerの代表実行、coverage生成、Storybook UIテスト、consumer検証。
- [ ] UI変更前にStorybook MCPの指示を取得し、hydration・portal・keyboard動作を確認。
- [ ] 比較/採否判断を完了し、必要な実装issueへ引き継いだら本issueを削除。
