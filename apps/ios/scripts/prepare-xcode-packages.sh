#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
swiftpm="$root/apps/ios/SPrivate.xcodeproj/project.xcworkspace/xcshareddata/swiftpm"

# Seed Xcode's own lockfile before it can adopt the local API package's lockfile.
mkdir -p "$swiftpm"
cp "$root/apps/ios/Package.resolved" "$swiftpm/Package.resolved"
