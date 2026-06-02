# CockroachDB セキュリティ対応 TODO

issue 棚卸し結果（2026-05-30 時点）の作業分担。

- **完了**: security-005 ①ロール分離・④TLS verify-full（詳細は [issue](issues/security-005-cockroachdb-hardening.md) / [runbook](docs/cockroachdb-role-minimization-runbook.md)）
- **対応中**: security-004（本番動作確認）
- **見送り**: security-005 の ②監査ログ・③ネットワーク制限（Vercel + Cloud Basic では実効性低 / 対応不可）
- **保留**: security-008（Prisma tenant extension）— ファイルは据え置き

---

## 🧑 自分でやること（クラスタ操作・シークレット・本番検証）

これらはクラスタへの接続権限・Doppler/Vercel のシークレット・デプロイ済み環境でしか確認できないため、自分で実施する。

### security-004 本番動作確認

- [ ] preview/本番で意図的にPrismaエラーを発生させ、Sentry に `source: prisma` タグ付きイベントが流入することを確認
- [ ] そのSentryイベントに **クエリ本文・パラメータが含まれていない** ことを確認（`errorFormat: "minimal"` の効果検証）
- [ ] `pnpm test` 全件 pass を CI で確認

---

## ⏸ 保留（今回アクションなし・ファイル据え置き）

- [ ] security-008 — Prisma Extension + AsyncLocalStorage による userId のDB層強制（中規模リファクタ。価値は用途次第）

---

## 対象外（CockroachDB 関連だが「セキュリティ対策」ではない）

- refactor-006 — `prisma migrate dev` の CockroachDB Cloud 制約（恒久回避済み）
