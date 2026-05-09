// Side-effect module: aliases Vercel Supabase Marketplace env vars
// (POSTGRES_PRISMA_URL / POSTGRES_URL_NON_POOLING) to the canonical
// names Prisma expects. Import this before any code reads
// process.env.DATABASE_URL or DIRECT_URL.
//
// Vercel-Supabase URLs do not include `sslmode`, but Supabase's pooler
// presents a cert chain (Supabase root CA) that Node.js does not trust
// by default — strict verification surfaces as `SELF_SIGNED_CERT_IN_CHAIN`.
// Append `sslmode=no-verify` (idempotent) so @prisma/adapter-pg / pg can
// establish the TLS session.
function withNoVerifySsl(url: string | undefined) {
	if (!url) return url;
	if (/[?&]sslmode=/i.test(url)) return url;
	return `${url}${url.includes("?") ? "&" : "?"}sslmode=no-verify`;
}

process.env.DATABASE_URL ??= withNoVerifySsl(
	process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL,
);
process.env.DIRECT_URL ??=
	withNoVerifySsl(process.env.POSTGRES_URL_NON_POOLING) ??
	process.env.DATABASE_URL;
