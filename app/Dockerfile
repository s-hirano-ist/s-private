# Build Stage
# MEMO: alpine based images is not recommended for prod useage https://github.com/nodejs/docker-node#nodealpine

FROM node:23.7.0-slim@sha256:a5163af143b43b0da7572444bd49a22edb4cc1a74d3a46e1ef840f62bce07cac AS base
RUN apt-get update && apt-get install -y ca-certificates && update-ca-certificates

# Install pnpm
RUN npm install -g pnpm

# Install dependencies only when needed
FROM base AS deps

# Set working directory
WORKDIR /app

# Copy only package.json, pnpm-lock.yaml, and prisma schema for installing dependencies
COPY package.json pnpm-lock.yaml ./
COPY prisma/ ./prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

# Copy rest of the application code
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

# Extract secrets
RUN --mount=type=secret,id=AUTH_SECRET \
    --mount=type=secret,id=AUTH0_CLIENT_ID \
    --mount=type=secret,id=AUTH0_CLIENT_SECRET \
    --mount=type=secret,id=AUTH0_ISSUER_BASE_URL \
    --mount=type=secret,id=PUSHOVER_URL \
    --mount=type=secret,id=PUSHOVER_APP_TOKEN \
    --mount=type=secret,id=PUSHOVER_USER_KEY \
    --mount=type=secret,id=MINIO_ACCESS_KEY \
    --mount=type=secret,id=MINIO_BUCKET_NAME \
    --mount=type=secret,id=MINIO_HOST \
    --mount=type=secret,id=MINIO_PORT \
    --mount=type=secret,id=MINIO_SECRET_KEY \
    --mount=type=secret,id=NEXT_PUBLIC_SENTRY_DSN \
    --mount=type=secret,id=DATABASE_URL \
    --mount=type=secret,id=SENTRY_AUTH_TOKEN \
    --mount=type=secret,id=SENTRY_REPORT_URL \
    echo "AUTH_SECRET=$(cat /run/secrets/AUTH_SECRET)\n\
AUTH0_CLIENT_ID=$(cat /run/secrets/AUTH0_CLIENT_ID)\n\
AUTH0_CLIENT_SECRET=$(cat /run/secrets/AUTH0_CLIENT_SECRET)\n\
AUTH0_ISSUER_BASE_URL=$(cat /run/secrets/AUTH0_ISSUER_BASE_URL)\n\
PUSHOVER_URL=$(cat /run/secrets/PUSHOVER_URL)\n\
PUSHOVER_APP_TOKEN=$(cat /run/secrets/PUSHOVER_APP_TOKEN)\n\
PUSHOVER_USER_KEY=$(cat /run/secrets/PUSHOVER_USER_KEY)\n\
MINIO_ACCESS_KEY=$(cat /run/secrets/MINIO_ACCESS_KEY)\n\
MINIO_BUCKET_NAME=$(cat /run/secrets/MINIO_BUCKET_NAME)\n\
MINIO_HOST=$(cat /run/secrets/MINIO_HOST)\n\
MINIO_PORT=$(cat /run/secrets/MINIO_PORT)\n\
MINIO_SECRET_KEY=$(cat /run/secrets/MINIO_SECRET_KEY)\n\
NEXT_PUBLIC_SENTRY_DSN=$(cat /run/secrets/NEXT_PUBLIC_SENTRY_DSN)\n\
DATABASE_URL=$(cat /run/secrets/DATABASE_URL)\n\
SENTRY_AUTH_TOKEN=$(cat /run/secrets/SENTRY_AUTH_TOKEN)\n\
SENTRY_REPORT_URL=$(cat /run/secrets/SENTRY_REPORT_URL)\n" > .env

# Generate Prisma client
RUN pnpm run prisma:generate

# Build the application
RUN pnpm run build

# Production image, copy all the files and run Next.js
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Expose port 3000
EXPOSE 3000
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s CMD wget --no-verbose --tries=1 --spider http://0.0.0.0:3000/api/health || exit 1

# server.js is created by Next.js build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
ENV HOSTNAME="0.0.0.0"

# Command to start the application
CMD ["node", "server.js"]
