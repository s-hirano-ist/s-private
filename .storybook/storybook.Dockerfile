# build
FROM node:24.12.0-slim@sha256:b83af04d005d8e3716f542469a28ad2947ba382f6b4a76ddca0827a21446a540 AS builder

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
COPY packages/scripts/package.json ./packages/scripts/package.json
COPY packages/notification/package.json ./packages/notification/package.json

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run storybook:build

# run
FROM httpd:2.4.66@sha256:dd178595edd6d4f49296f62f9587238db2cd1045adfff6fccc15a6c4d08f5d2e AS runner

RUN groupadd --system --gid 1001 storybook && \
    useradd --system --uid 1001 --gid storybook storybook && \
    chown -R storybook:storybook /usr/local/apache2/htdocs/

COPY --from=builder --chown=storybook:storybook /app/.storybook-static /usr/local/apache2/htdocs/

USER storybook
