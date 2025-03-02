# build
FROM node:23.7.0-alpine@sha256:70eca392e3d52cb7d133b52d52e8600d8c410a5eaee6105c11324b28868f9ac9 AS builder

RUN npm install -g pnpm
WORKDIR /app

ENV SKIP_ENV_VALIDATION=true
ENV MINIO_HOST=private.s-hirano.com

COPY package.json pnpm-lock.yaml prisma ./
RUN pnpm install
COPY . .
RUN pnpm run storybook:build

# run
FROM httpd:2.4.63@sha256:10381816bb7e60ae3a9db3784f2966a8910b6ff07c4da54bd2d62d2671c8ab6e AS runner
COPY --from=builder /app/.storybook-static /usr/local/apache2/htdocs/
