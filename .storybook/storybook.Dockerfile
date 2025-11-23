# build
FROM node:24.11.1-alpine@sha256:2867d550cf9d8bb50059a0fff528741f11a84d985c732e60e19e8e75c7239c43 AS builder

RUN npm install -g pnpm
WORKDIR /app

ENV SKIP_ENV_VALIDATION=true
ENV MINIO_HOST=private.s-hirano.com

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY app/prisma/ ./app/prisma/
COPY app/package.json ./app/package.json
COPY packages/components/package.json ./packages/components/package.json
COPY packages/domains/package.json ./packages/domains/package.json

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run storybook:build

# run
FROM httpd:2.4.65@sha256:f9b88f3f093d925525ec272bbe28e72967ffe1a40da813fe84df9fcb2fad3f30 AS runner
COPY --from=builder /app/.storybook-static /usr/local/apache2/htdocs/
