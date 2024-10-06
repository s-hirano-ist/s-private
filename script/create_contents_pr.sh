#!/bin/sh

npm run corepack
pnpm i --frozen-lockfile

git clone https://${GITHUB_SECRET_KEY}@github.com/s-hirano-ist/s-contents.git

# Genrate files
pnpm contents

cd s-contents

# Git
git config --global user.name ${GITHUB_USER_NAME}
git config --global user.email ${GITHUB_USER_EMAIL}

branch_name=conents--update-news-$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 6)
git checkout -b $branch_name

git status

git add -A
git commit -m "contents: update content"

# Push to GitHub
REPO_URL="https://${GITHUB_SECRET_KEY}@github.com/s-hirano-ist/s-contents.git"
git push $REPO_URL $branch_name

# Make PR
curl \
    -X POST \
    -H "Authorization: token ${GITHUB_SECRET_KEY}" \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/repos/s-hirano-ist/s-contents/pulls \
    -d '{
        "title": "contents: update content",
        "body": "https://github.com/s-hirano-ist/s-contents から取得したエクスポートしたコンテンツ一覧。",
        "base": "main",
        "head": "'${branch_name}'"
    }'
