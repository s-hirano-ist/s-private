// Side-effect module: aliases Vercel Supabase Marketplace env vars
// (POSTGRES_PRISMA_URL / POSTGRES_URL_NON_POOLING) to the canonical
// names Prisma expects. Import this before any code reads
// process.env.DATABASE_URL or DIRECT_URL.
//
// Vercel-Supabase Marketplace で注入される URL には `sslmode=require` が
// 既に付与されているが、@prisma/adapter-pg (pg) はそれを strict verify
// として解釈し、Supabase の cert chain を Node.js が信頼できず
// `SELF_SIGNED_CERT_IN_CHAIN` / Prisma `P1011 TlsConnectionError` を投げる。
// そこで `sslmode` を **常に `no-verify` に正規化** して TLS 検証だけを
// 緩める（暗号化自体は維持される）。
//
// SECURITY:
//   sslmode=no-verify はサーバー証明書の検証を行わず MITM 耐性が下がる。
//   Vercel ↔ Supabase は同一クラウド内 routing のため現実的リスクは低いが、
//   理想形は Supabase root CA を `ssl.ca` で pin する形 (TODO)。
//
// ローカル開発:
//   Doppler で `DATABASE_URL` を直接設定しているケースでは、下の `??=` で
//   何も上書きしないため、Docker Postgres (`sslmode=disable`) など既存の
//   設定にも影響しない。
export function withNoVerifySsl(url: string | undefined): string | undefined {
	if (!url) return url;
	if (/[?&]sslmode=no-verify\b/i.test(url)) return url;
	if (/[?&]sslmode=[^&]*/i.test(url)) {
		return url.replace(/([?&])sslmode=[^&]*/i, "$1sslmode=no-verify");
	}
	return `${url}${url.includes("?") ? "&" : "?"}sslmode=no-verify`;
}

process.env.DATABASE_URL ??= withNoVerifySsl(
	process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL,
);
process.env.DIRECT_URL ??=
	withNoVerifySsl(process.env.POSTGRES_URL_NON_POOLING) ??
	process.env.DATABASE_URL;
