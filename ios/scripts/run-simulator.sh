#!/bin/bash

set -euo pipefail

readonly project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
readonly derived_data_path="${project_root}/ios/.derivedData"
readonly project_path="${project_root}/ios/SPrivate.xcodeproj"
readonly scheme="SPrivate"
readonly bundle_id="ist.s-hirano.s-private"

if ! command -v xcodebuild >/dev/null 2>&1 || ! xcodebuild -version >/dev/null 2>&1; then
  echo "Xcode 27 is required. Install the full Xcode app and select it with xcode-select." >&2
  exit 1
fi

sdk_version="$(xcrun --sdk iphonesimulator --show-sdk-version 2>/dev/null || true)"
if [[ "${sdk_version}" != 27.* ]]; then
  echo "The iOS 27 Simulator SDK is required; detected '${sdk_version:-none}'." >&2
  echo "Run: xcodebuild -downloadPlatform iOS -buildVersion 27.0" >&2
  exit 1
fi

device_id="$(
  xcrun simctl list devices available |
    awk -F "[()]" '
      /^-- iOS 27([.][0-9]+)* --$/ { in_runtime = 1; next }
      /^-- / { in_runtime = 0 }
      in_runtime && /iPhone 17 \(/ {
        print $2
        exit
      }
    '
)"

if [[ -z "${device_id}" ]]; then
  echo "No available iPhone 17 device was found in an iOS 27 Simulator runtime." >&2
  echo "Install the iOS 27 runtime from Xcode Settings > Components." >&2
  exit 1
fi

xcrun simctl boot "${device_id}" 2>/dev/null || true
simulator_app="${DEVELOPER_DIR}/Applications/Simulator.app"
if [[ -d "${simulator_app}" ]]; then
  open "${simulator_app}"
fi
xcrun simctl bootstatus "${device_id}" -b

xcodebuild \
  -project "${project_path}" \
  -scheme "${scheme}" \
  -destination "platform=iOS Simulator,id=${device_id}" \
  -derivedDataPath "${derived_data_path}" \
  CODE_SIGNING_ALLOWED=NO \
  build

readonly app_path="${derived_data_path}/Build/Products/Debug-iphonesimulator/SPrivate.app"
xcrun simctl install "${device_id}" "${app_path}"
xcrun simctl launch "${device_id}" "${bundle_id}"
