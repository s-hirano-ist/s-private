# build
FROM node:24.13.1-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2 AS builder

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
FROM httpd:2.4.66@sha256:b89c19a390514d6767e8c62f29375d0577190be448f63b24f5f11d6b03f7bf18 AS runner

RUN groupadd --system --gid 1001 storybook && \
    useradd --system --uid 1001 --gid storybook storybook && \
    chown -R storybook:storybook /usr/local/apache2/htdocs/

COPY --from=builder --chown=storybook:storybook /app/.storybook-static /usr/local/apache2/htdocs/

USER storybook
