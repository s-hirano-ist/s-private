// Side-effect module: ensures DIRECT_URL falls back to DATABASE_URL.
// Import this before any code reads process.env.DATABASE_URL or DIRECT_URL.
//
// CockroachDB Cloud Basic は接続プーリングが内蔵で、Supabase の Supavisor の
// ような pooled / direct の二重 URL を持たない。よって `DIRECT_URL`（Prisma の
// migrate が使用）は `DATABASE_URL` と同値でよく、未設定時はフォールバックさせる。
//
// TLS:
//   CockroachDB Cloud は `sslmode=verify-full`（パブリック CA）が前提のため、
//   Supabase 時に必要だった `sslmode` の書き換えハックは不要。接続文字列の
//   `sslmode` をそのまま尊重する。ローカル / CI の insecure クラスタは接続文字列に
//   `sslmode=disable` を直接指定する（`compose.yaml` の cockroachdb サービス）。
process.env.DIRECT_URL ??= process.env.DATABASE_URL;
