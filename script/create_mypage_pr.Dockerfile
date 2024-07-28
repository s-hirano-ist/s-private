FROM node:20.16.0-alpine

RUN apk update && apk add --no-cache git curl jq openssh

COPY package.json pnpm-lock.yaml pr-mypage.ts create_mypage_pr.sh biome.json .npmrc .env /

RUN chmod +x /create_mypage_pr.sh

ENV GITHUB_SECRET_KEY=${GITHUB_SECRET_KEY}
ENV GITHUB_USER_NAME=${GITHUB_USER_NAME}
ENV GITHUB_USER_EMAIL=${GITHUB_USER_EMAIL}
ENV POSTGRES_URL=${POSTGRES_URL}
# ENV PGHOST=${PGHOST}
# ENV PGPORT=${PGPORT}
# ENV PGUSER=${PGUSER}
# ENV PGPASSWORD=${PGPASSWORD}
# ENV PGDATABASE=${PGDATABASE}
# ENV OUTPUT_PATH=${OUTPUT_PATH}

ENTRYPOINT ["sh", "/create_mypage_pr.sh"]
