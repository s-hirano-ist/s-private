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
FROM httpd:2.4.64@sha256:ff7da4e158110cff0fdb0951a6859a971f9b4a1a7487427d1e039d640951a7f5 AS runner
COPY --from=builder /app/.storybook-static /usr/local/apache2/htdocs/
