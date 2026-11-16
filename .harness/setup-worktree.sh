#!/bin/sh
set -eu

# Fetch failures and diverged histories must stop setup before development starts.
git fetch origin main
git -c merge.autoStash=false merge --ff-only origin/main
