# build
FROM node:24.14.0-slim@sha256:e8e2e91b1378f83c5b2dd15f0247f34110e2fe895f6ca7719dbb780f929368eb AS builder

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
FROM httpd:2.4.66@sha256:96b1e8f69ee3adde956e819f7a7c3e706edef7ad88a26a491734015e5c595333 AS runner

RUN groupadd --system --gid 1001 storybook && \
    useradd --system --uid 1001 --gid storybook storybook && \
    chown -R storybook:storybook /usr/local/apache2/htdocs/

COPY --from=builder --chown=storybook:storybook /app/.storybook-static /usr/local/apache2/htdocs/

USER storybook
