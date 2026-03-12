# Development Setup

## Quick Start

```bash
pnpm install
docker compose up -d  # Start PostgreSQL, Embedding API (TEI), etc.
pnpm dev
```

## Mise Configuration

This project uses [Mise](https://mise.jdx.dev/) for Node.js and package manager version management. The tools and their versions are defined in `.mise.toml`.

To set up your environment:

1. Install [Mise](https://mise.jdx.dev/getting-started.html)
2. Run the following command in the project root to install the required tools:
   ```bash
   mise install
   ```

**Note**: Once installed, Mise will automatically use the correct Node.js and pnpm versions specified in `.mise.toml` when you enter the project directory.

## Environment Variables

Copy `.env.sample` to `.env.local` and fill in required values.

### Required Variables

**Authentication (Auth0)**:
- `AUTH_SECRET` - NextAuth.js secret (generate with `openssl rand -base64 32`)
- `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_ISSUER_BASE_URL` - Auth0 configuration

**Database**:
- `DATABASE_URL` - PostgreSQL connection string

**External Services**:
- `PUSHOVER_URL`, `PUSHOVER_USER_KEY`, `PUSHOVER_APP_TOKEN` - Notification service
- `SENTRY_AUTH_TOKEN`, `SENTRY_REPORT_URL` - Error monitoring
- `NEXT_PUBLIC_SENTRY_DSN` - Client-side Sentry (public variable)

**Object Storage (MinIO)**:
- `MINIO_HOST`, `MINIO_PORT`, `MINIO_BUCKET_NAME` - MinIO server configuration
- `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` - MinIO credentials

**RAG Search (Embedding + Vector DB)**:
- `EMBEDDING_API_URL` - TEI endpoint URL (e.g., `http://localhost:3001`)
- `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET` - Cloudflare Access credentials (VPS only)
- `QDRANT_URL` - Qdrant server URL
- `QDRANT_API_KEY` - Qdrant API key

Type definitions and validation are in `src/env.ts` using `@t3-oss/env-nextjs` with Zod.
