#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
package="$root/ios/Packages/SPrivateAPI"
sources="$package/Sources/SPrivateAPI"

# Keep the generator on the host; Xcode must only compile the generated API for iOS.
swift run --package-path "$package" swift-openapi-generator generate \
  "$root/docs/openapi/backend-v1.json" \
  --config "$sources/openapi-generator-config.yaml" \
  --output-directory "$sources/Generated"
