# build
FROM node:22.12.0-alpine@sha256:6e80991f69cc7722c561e5d14d5e72ab47c0d6b6cfb3ae50fb9cf9a7b30fdf97 AS builder

RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml prisma ./
RUN pnpm install
COPY . .
RUN pnpm run storybook:build

# run
FROM httpd:2.4.62@sha256:72f6e24600718dddef131de7cb5b31496b05c5af41e9db8707df371859a350bb AS runner
COPY --from=builder /app/.storybook-static /usr/local/apache2/htdocs/
