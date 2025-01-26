#!/bin/sh

if [ -z "$1" ]; then
  echo "使い方: $0 <タグ>"
  exit 1
fi

if ! echo "$1" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
  echo "error: Tags must have a format of x.x.x.（e.g.: 1.0.0）"
  exit 1
fi

if ! docker info > /dev/null 2>&1; then
  echo "error: No docker deamon ready."
  exit 1
fi

TAG=$1

echo "Start building image..."
docker build --platform linux/amd64 -t s0hirano/s-database:$TAG -f docker/database.Dockerfile . || {
  echo "error: Failed to build image."
  exit 1
}

echo "Start pushing image..."
docker push s0hirano/s-database:$TAG || {
  echo "error: Failed to push image."
  exit 1
}

echo "success: Successfully pushed image s0hirano/s-database:${TAG}."
