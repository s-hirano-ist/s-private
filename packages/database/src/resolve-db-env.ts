// Side-effect module: aliases Vercel Supabase Marketplace env vars
// (POSTGRES_PRISMA_URL / POSTGRES_URL_NON_POOLING) to the canonical
// names Prisma expects. Import this before any code reads
// process.env.DATABASE_URL or DIRECT_URL.
process.env.DATABASE_URL ??=
	process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL;
process.env.DIRECT_URL ??=
	process.env.POSTGRES_URL_NON_POOLING ?? process.env.DATABASE_URL;
