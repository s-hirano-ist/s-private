# 依存監査で検出された推移依存の脆弱性を解消・評価する

## Metadata

| Field | Value |
| --- | --- |
| Category | Security / Dependencies |
| Priority | HIGH |
| Status | 未着手 |
| Observed | 2026-09-12、9d1a06c3 |

## 問題と根拠

`pnpm audit --json`で19件（High 11、Moderate 7、Low 1）を検出。
すべて推移依存であり、検出件数とアプリでの悪用可能性は別。
[棚卸し報告](../docs/dependency-audit.md)のセキュリティ節に全GHSA・修正下限・経路を記録した。

| 対象 | 現行 → 今回の検出を解消する下限 | 導入元 |
| --- | --- | --- |
| fast-uri | 3.1.3 → 3.1.6 | Prisma CLI / Sentry-webpack / Stylelint / Strykerのajv |
| deepmerge-ts | 7.1.5 → 8.0.0 | Prisma config |
| mysql2 | 3.15.3 → 3.23.1 | Prisma CLI |
| browserslist | 4.28.4 → 4.28.7 | Next / Babel / Storybook等 |
| baseline-browser-mapping | 2.10.41 → 2.11.0 | Next / browserslist |
| qs | 6.15.1・6.15.3 → 6.16.0 | Stryker / Google Books SDK |
| decode-uri-component | 0.2.2 → 0.5.0 | MinIO / query-string |
| stream-json | 1.9.1 → 3.5.0 | MinIO |
| esbuild | 0.27.7 → 0.28.1 | tsup |
| js-yaml | 4.3.1 → 4.3.2 | Stylelint / cosmiconfig |

## 対応

- 作業開始時にauditを再取得し、親の依存範囲内で修正版に更新できる経路を先に修正する。
- Prisma CLIのmysql2固定版やdeepmerge-tsのメジャー差は、親の対応版・公式修正を確認。
  Prisma latestがRCを指すため、`latest`一括更新や互換性未確認の強制overrideは使わない。
- tsup、Books、MinIOの交換作業は各issueへ分離し、本issueでは残存経路と解消結果を管理する。
  Books除去後もStrykerのqsは残る。
- MinIOはquery-stringのstringifyとJSONL Parser利用が確認され、対象decode/filterへの到達は未確認。
  MySQLは使用せずCockroachDB/pg adapterを使用。開発・本番成果物・実際の呼び出しを区別する。
- 検出を残す場合はGHSA単位で、実行条件、到達性の根拠、上流ブロッカー、再確認条件を記録する。
  devDependenciesへの移動やaudit除外だけを修正完了としない。

## 完了条件・検証

- [ ] 全検出を解消、または未解消の個別根拠・次の対応を報告書へ記録。
- [ ] `pnpm audit --json`、該当パッケージの`pnpm -r why`を再実行。
- [ ] `pnpm check:agent`、`pnpm build`を成功させる。
- [ ] 変更対象に応じてPrisma generate・認証・設定ファイル読込・CSS lintを検証。
- [ ] DB schema変更・migration実行・外部サービス変更は本対応に含めない。

移行実装の完了後にこのissueを削除する。今回の棚卸しでは実装していない。
