# build
FROM node:22.13.0-alpine@sha256:f2dc6eea95f787e25f173ba9904c9d0647ab2506178c7b5b7c5a3d02bc4af145 AS builder

RUN npm install -g pnpm
WORKDIR /app

# Extract secrets
RUN --mount=type=secret,id=AUTH_SECRET \
    --mount=type=secret,id=AUTH_URL \
    --mount=type=secret,id=AUTH0_ID \
    --mount=type=secret,id=AUTH0_SECRET \
    --mount=type=secret,id=AUTH0_ISSUER \
    --mount=type=secret,id=LINE_NOTIFY_SECRET_TOKEN \
    --mount=type=secret,id=LINE_NOTIFY_URL \
    --mount=type=secret,id=MINIO_ACCESS_KEY \
    --mount=type=secret,id=MINIO_BUCKET_NAME \
    --mount=type=secret,id=MINIO_HOST \
    --mount=type=secret,id=MINIO_PORT \
    --mount=type=secret,id=MINIO_SECRET_KEY \
    --mount=type=secret,id=NEXT_PUBLIC_G_TAG \
    --mount=type=secret,id=NEXT_PUBLIC_SENTRY_DSN \
    --mount=type=secret,id=POSTGRES_DIRECT_URL \
    --mount=type=secret,id=POSTGRES_URL \
    --mount=type=secret,id=SENTRY_AUTH_TOKEN \
    --mount=type=secret,id=SENTRY_REPORT_URL \
    echo "AUTH_SECRET=$(cat /run/secrets/AUTH_SECRET)\n\
AUTH_URL=$(cat /run/secrets/AUTH_URL)\n\
AUTH0_ID=$(cat /run/secrets/AUTH0_ID)\n\
AUTH0_SECRET=$(cat /run/secrets/AUTH0_SECRET)\n\
AUTH0_ISSUER=$(cat /run/secrets/AUTH0_ISSUER)\n\
LINE_NOTIFY_SECRET_TOKEN=$(cat /run/secrets/LINE_NOTIFY_SECRET_TOKEN)\n\
LINE_NOTIFY_URL=$(cat /run/secrets/LINE_NOTIFY_URL)\n\
MINIO_ACCESS_KEY=$(cat /run/secrets/MINIO_ACCESS_KEY)\n\
MINIO_BUCKET_NAME=$(cat /run/secrets/MINIO_BUCKET_NAME)\n\
MINIO_HOST=$(cat /run/secrets/MINIO_HOST)\n\
MINIO_PORT=$(cat /run/secrets/MINIO_PORT)\n\
MINIO_SECRET_KEY=$(cat /run/secrets/MINIO_SECRET_KEY)\n\
NEXT_PUBLIC_G_TAG=$(cat /run/secrets/NEXT_PUBLIC_G_TAG)\n\
NEXT_PUBLIC_SENTRY_DSN=$(cat /run/secrets/NEXT_PUBLIC_SENTRY_DSN)\n\
POSTGRES_DIRECT_URL=$(cat /run/secrets/POSTGRES_DIRECT_URL)\n\
POSTGRES_URL=$(cat /run/secrets/POSTGRES_URL)\n\
SENTRY_AUTH_TOKEN=$(cat /run/secrets/SENTRY_AUTH_TOKEN)\n\
SENTRY_REPORT_URL=$(cat /run/secrets/SENTRY_REPORT_URL)\n" > .env

COPY package.json pnpm-lock.yaml prisma ./
RUN pnpm install
COPY . .
RUN pnpm run storybook:build

# run
FROM httpd:2.4.62@sha256:4c7788695c832bf415a662dfb5160f1895e65fc65c025e85f436ee2c9e7d7f3e AS runner
COPY --from=builder /app/.storybook-static /usr/local/apache2/htdocs/
