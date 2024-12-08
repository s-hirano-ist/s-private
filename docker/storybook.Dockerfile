# build
FROM node:22.11.0-alpine@sha256:b64ced2e7cd0a4816699fe308ce6e8a08ccba463c757c00c14cd372e3d2c763e AS builder

RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml prisma ./
RUN pnpm install
COPY . .
RUN pnpm run storybook:build

# run
FROM httpd:2.4.62@sha256:f4c5139eda466e45814122d9bd8b886d8ef6877296126c09b76dbad72b03c336 AS runner
COPY --from=builder /app/.storybook-static /usr/local/apache2/htdocs/
