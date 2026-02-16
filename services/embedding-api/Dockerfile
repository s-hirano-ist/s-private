FROM node:24.13.1-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2 AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY services/embedding-api/package.json ./services/embedding-api/
COPY packages/search/package.json ./packages/search/
RUN pnpm install --frozen-lockfile --filter @s-hirano-ist/embedding-api...

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/embedding-api/node_modules ./services/embedding-api/node_modules
COPY --from=deps /app/packages/search/node_modules ./packages/search/node_modules
COPY packages/search/ ./packages/search/
COPY services/embedding-api/ ./services/embedding-api/
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
RUN pnpm --filter @s-hirano-ist/s-search build
RUN node -e " \
  const fs = require('fs'); \
  const path = './packages/search/package.json'; \
  const pkg = JSON.parse(fs.readFileSync(path, 'utf8')); \
  if (pkg.publishConfig && pkg.publishConfig.exports) { \
    pkg.exports = pkg.publishConfig.exports; \
  } \
  fs.writeFileSync(path, JSON.stringify(pkg, null, '\t') + '\n'); \
"
RUN pnpm --filter @s-hirano-ist/embedding-api build
RUN pnpm --filter @s-hirano-ist/embedding-api deploy --prod --legacy /app/deployed

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/deployed/node_modules ./node_modules
COPY --from=builder /app/deployed/dist ./dist
EXPOSE 3001
HEALTHCHECK --interval=30s --start-period=120s CMD node -e "fetch('http://localhost:3001/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "dist/index.js"]
