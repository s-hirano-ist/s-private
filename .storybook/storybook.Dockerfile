# build
FROM node:22.13.0-alpine@sha256:f2dc6eea95f787e25f173ba9904c9d0647ab2506178c7b5b7c5a3d02bc4af145 AS builder

RUN npm install -g pnpm
WORKDIR /app

ENV SKIP_ENV_VALIDATION=true

COPY package.json pnpm-lock.yaml prisma ./
RUN pnpm install
COPY . .
RUN pnpm run storybook:build

# run
FROM httpd:2.4.63@sha256:437b9f7d469dd606fa6d2a5f9a3be55fe3af7e0c66e0329da8c14b291ae0d31c AS runner
COPY --from=builder /app/.storybook-static /usr/local/apache2/htdocs/
