#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
group="${IOS_TEST_GROUP:-all}"
if [[ "${1:-}" == "--print-selection" ]]; then group="${2:-all}"; fi

# Balance navigation and list-layout cases against the remaining UI cases.
# New UI cases stay in the ui group.
navigation=(
  SPrivateUITests/SPrivateUITests/testFourDomainTabsOfferHeaderActionsInWebOrder
  SPrivateUITests/SPrivateUITests/testFourDomainTabsDefaultToExportedAndToggleWithOneTap
  SPrivateUITests/SPrivateUITests/testDomainTabsFollowSystemLanguage
  SPrivateUITests/SPrivateUITests/testArticleAndNoteEmptyStatesDoNotCreateBlankRows
  SPrivateUITests/SPrivateUITests/testArticleAndNoteRowsShowLongTitlesAndOpenTheirDestinations
)
selection=()
case "$group" in
  all) ;;
  unit) selection+=(-only-testing:SPrivateTests) ;;
  rss) selection+=(-only-testing:SPrivateUITests/RssUITests) ;;
  layout) selection+=(-only-testing:SPrivateUITests/LoadingLayoutUITests) ;;
  navigation)
    for identifier in "${navigation[@]}"; do selection+=("-only-testing:$identifier"); done
    ;;
  ui)
    selection+=(-only-testing:SPrivateUITests -skip-testing:SPrivateUITests/RssUITests -skip-testing:SPrivateUITests/LoadingLayoutUITests)
    for identifier in "${navigation[@]}"; do selection+=("-skip-testing:$identifier"); done
    ;;
  *) echo "Unknown iOS test group: $group" >&2; exit 2 ;;
esac
if [[ "${1:-}" == "--print-selection" ]]; then
  if [[ ${#selection[@]} -gt 0 ]]; then printf '%s\n' "${selection[@]}"; fi
  exit 0
fi

shopt -s nullglob
runs=("$root"/apps/ios/.derivedData/Build/Products/*.xctestrun)
if [[ ${#runs[@]} -ne 1 ]]; then
  echo 'Expected one xctestrun file. Run mise run ios:test:build first.' >&2
  exit 1
fi
mkdir -p "$root/apps/ios/.test-results"
result_directory="$(mktemp -d "$root/apps/ios/.test-results/$group.XXXXXX")"

# Finish first-boot migrations before XCTest's application-launch timeout starts.
# Resolve one device for both preparation and testing; OS=latest can select another runtime.
device_info="$(
  xcrun simctl list devices available |
    awk -F "[()]" -v target="${IOS_SIMULATOR_UDID:-}" '
      /^-- iOS 27([.][0-9]+)* --$/ { in_runtime = 1; next }
      /^-- / { in_runtime = 0 }
      in_runtime && ((target != "" && $2 == target) || (target == "" && /^[[:space:]]*iPhone 17 \(/)) {
        print $2, $4
        exit
      }
    '
)"
read -r device_id device_state <<< "$device_info"
if [[ -z "$device_id" ]]; then
  echo 'No selected iPhone 17 / iOS 27 Simulator is available.' >&2
  exit 1
fi
if [[ "$device_state" != Booted ]]; then xcrun simctl boot "$device_id"; fi
xcrun simctl bootstatus "$device_id" -b

# The Debug fixture uses an in-memory store and makes no backend or Auth0 requests.
# Install and start it before XCTest launches its runner, paying the cold app startup once.
xcrun simctl install "$device_id" "$root/apps/ios/.derivedData/Build/Products/Debug-iphonesimulator/SPrivate.app"
xcrun simctl launch "$device_id" ist.s-hirano.s-private -ui-testing-authenticated -ui-testing-list-fixtures

# CI distributes groups across machines. Each group uses one Simulator, avoiding
# cloned devices competing for CPU, memory and the fixture app's App Group.
xcodebuild test-without-building \
  -xctestrun "${runs[0]}" \
  -destination "platform=iOS Simulator,id=$device_id" \
  -destination-timeout 60 \
  -parallel-testing-enabled NO \
  -resultBundlePath "$result_directory/Tests.xcresult" \
  ${selection[@]+"${selection[@]}"}
