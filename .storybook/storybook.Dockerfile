# build
FROM node:23.7.0-alpine@sha256:70eca392e3d52cb7d133b52d52e8600d8c410a5eaee6105c11324b28868f9ac9 AS builder

RUN npm install -g pnpm
WORKDIR /app

ENV SKIP_ENV_VALIDATION=true
ENV MINIO_HOST=private.s-hirano.com

COPY package.json pnpm-lock.yaml ./
COPY app/prisma/ ./app/prisma/

RUN pnpm install
COPY . .
RUN pnpm run storybook:build

# run
FROM httpd:2.4.65@sha256:ca375ab8ef2cb8bede6b1bb97a943cce7f0a304d5459c05235b47bc2dccb98cd AS runner
COPY --from=builder /app/.storybook-static /usr/local/apache2/htdocs/
