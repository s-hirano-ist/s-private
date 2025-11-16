# build
FROM node:24.11.0-alpine@sha256:f36fed0b2129a8492535e2853c64fbdbd2d29dc1219ee3217023ca48aebd3787 AS builder

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
FROM httpd:2.4.65@sha256:ecfd5ca1bfe1fc5e44a5836c5188bde7f397b50c7a5bb603a017543e29948a01 AS runner
COPY --from=builder /app/.storybook-static /usr/local/apache2/htdocs/
