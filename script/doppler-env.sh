#!/usr/bin/env bash
# .env.local から DOPPLER_TOKEN を読み込み、Doppler secrets を環境変数に注入する
# 用途: source script/doppler-env.sh

set -euo pipefail

ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "[doppler-env] $ENV_FILE not found. See README.md for setup instructions." >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

if [ -z "${DOPPLER_TOKEN:-}" ]; then
  echo "[doppler-env] DOPPLER_TOKEN not found in $ENV_FILE" >&2
  exit 1
fi

export DOPPLER_TOKEN

set -a
eval "$(doppler secrets download --format=env-no-quotes --no-file)"
set +a
