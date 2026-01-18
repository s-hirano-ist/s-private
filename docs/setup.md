# Development Setup

## Quick Start

```bash
pnpm install
docker compose up --build -d  # Start PostgreSQL database
pnpm dev
```

## Volta Configuration

This project uses [Volta](https://volta.sh/) for Node.js and package manager version management. The versions are pinned in `package.json`:

- **Node.js**: 22.20.0
- **pnpm**: 10.18.2

### pnpm Support in Volta (Experimental)

Volta's pnpm support is currently experimental. To enable it:

1. Set the environment variable (required):
   ```bash
   # macOS/Linux - Add to ~/.zshrc or ~/.bash_profile
   export VOLTA_FEATURE_PNPM=1

   # Windows - Add to System Environment Variables
   # VOLTA_FEATURE_PNPM=1
   ```

2. Install pnpm via Volta:
   ```bash
   # If you have existing pnpm installed via Volta
   volta uninstall pnpm

   # Reinstall pnpm with experimental support enabled
   volta install pnpm
   ```

### Limitations

- Global installations (`pnpm install -g`) are not supported
- This is an experimental feature and may have issues

**Note**: Once configured, Volta will automatically use the correct Node.js and pnpm versions specified in `package.json` when you enter the project directory.

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

Type definitions and validation are in `src/env.ts` using `@t3-oss/env-nextjs` with Zod.
