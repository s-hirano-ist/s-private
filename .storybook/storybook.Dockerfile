# build
FROM node:23.7.0-alpine@sha256:70eca392e3d52cb7d133b52d52e8600d8c410a5eaee6105c11324b28868f9ac9 AS builder

RUN npm install -g pnpm
WORKDIR /app

ENV SKIP_ENV_VALIDATION=true
ENV MINIO_HOST=private.s-hirano.com

COPY package.json pnpm-lock.yaml ./
COPY s-schema/ ./s-schema/

RUN pnpm install
COPY . .
RUN pnpm run storybook:build

# run
FROM httpd:2.4.63@sha256:c11efd67f6308f2c25965e4e9d13ded15e7c45c0367b95f619a16e03c6c1e2b1 AS runner
COPY --from=builder /app/.storybook-static /usr/local/apache2/htdocs/
