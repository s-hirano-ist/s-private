#!/bin/sh

git clone https://github.com/s-hirano-ist/blog

cd blog

echo '{"new_key": "new_value"}' >> your_json_file.json

git config --global user.name ${GITHUB_USER_NAME}
git config --global user.email ${GITHUB_USER_EMAIL}

branch_name=conents--update-news-$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 6)
git checkout -b $branch_name

git add -A
git commit -m "contents: update news"

REPO_URL="https://${GITHUB_SECRET_KEY}@github.com/s-hirano-ist/blog.git"
git push $REPO_URL $branch_name


# make PR
curl \
    -X POST \
    -H "Authorization: token ${GITHUB_SECRET_KEY}" \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/repos/s-hirano-ist/blog/pulls \
    -d '{
        "title": "contents: update news",
        "body": "https://github.com/s-hirano-ist/dump-to-github から取得したエクスポートしたニュース一覧。",
        "base": "main",
        "head": "'${branch_name}'"
    }'
