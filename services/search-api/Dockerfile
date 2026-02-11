FROM node:24.13.0-slim AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY services/search-api/package.json ./services/search-api/
COPY packages/search/package.json ./packages/search/
RUN pnpm install --frozen-lockfile --filter @s-hirano-ist/search-api...

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/search-api/node_modules ./services/search-api/node_modules
COPY --from=deps /app/packages/search/node_modules ./packages/search/node_modules
COPY packages/search/ ./packages/search/
COPY services/search-api/ ./services/search-api/
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
RUN pnpm --filter @s-hirano-ist/s-search build
RUN pnpm --filter @s-hirano-ist/search-api build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/services/search-api/dist ./dist
COPY --from=builder /app/services/search-api/node_modules ./node_modules
COPY --from=builder /app/packages/search/dist ./packages/search/dist
COPY --from=builder /app/packages/search/package.json ./packages/search/
EXPOSE 3001
HEALTHCHECK --interval=30s CMD curl -f http://localhost:3001/health || exit 1
CMD ["node", "dist/index.js"]
