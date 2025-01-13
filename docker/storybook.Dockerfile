# build
FROM node:22.13.0-alpine@sha256:f2dc6eea95f787e25f173ba9904c9d0647ab2506178c7b5b7c5a3d02bc4af145 AS builder

RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml prisma ./
RUN pnpm install
COPY . .
RUN pnpm run storybook:build

# run
FROM httpd:2.4.62@sha256:72f6e24600718dddef131de7cb5b31496b05c5af41e9db8707df371859a350bb AS runner
COPY --from=builder /app/.storybook-static /usr/local/apache2/htdocs/
