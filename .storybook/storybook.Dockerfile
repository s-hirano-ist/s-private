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
FROM httpd:2.4.64@sha256:f84fe51ff5d35124e024f51215b443b16c939b24eae747025a515200e71c7d07 AS runner
COPY --from=builder /app/.storybook-static /usr/local/apache2/htdocs/
