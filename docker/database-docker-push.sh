#!/bin/sh

if [ -z "$1" ]; then
  echo "使い方: $0 <タグ>"
  exit 1
fi

TAG=$1

docker build --platform linux/amd64 -t s0hirano/s-database:$TAG -f docker/database.Dockerfile .
docker push s0hirano/s-database:$TAG
