# build
FROM node:24.12.0-alpine@sha256:c921b97d4b74f51744057454b306b418cf693865e73b8100559189605f6955b8 AS builder

RUN npm install -g pnpm
WORKDIR /app

ENV SKIP_ENV_VALIDATION=true
ENV MINIO_HOST=private.s-hirano.com

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/database/prisma/ ./packages/database/prisma/
COPY app/package.json ./app/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/core/package.json ./packages/core/package.json

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run storybook:build

# run
FROM httpd:2.4.66@sha256:b913eada2685f101f93267e0984109966bbcc3afea6c9b48ed389afbf89863aa AS runner
COPY --from=builder /app/.storybook-static /usr/local/apache2/htdocs/
