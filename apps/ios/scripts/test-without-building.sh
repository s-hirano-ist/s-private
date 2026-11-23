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

simctl=(xcrun simctl)
xcodebuild_options=()
device_id=
if [[ "${IOS_TEST_ISOLATED_SIMULATOR:-}" == 1 && -z "${IOS_SIMULATOR_UDID:-}" ]]; then
  # Avoid CoreSimulator pairing notifications from the hosted runner's default set.
  device_set="$(mktemp -d "${RUNNER_TEMP:-${TMPDIR:-/tmp}}/ios-test-devices.XXXXXX")"
  simctl+=(--set "$device_set")
  xcodebuild_options+=("-DVTSimulatorSetLocation=$device_set")
  cleanup_device_set() {
    if [[ -n "$device_id" ]]; then
      "${simctl[@]}" shutdown "$device_id" || true
      "${simctl[@]}" delete "$device_id" || return 0
    fi
    rm -rf -- "$device_set"
  }
  trap cleanup_device_set EXIT
  runtime="$("${simctl[@]}" list runtimes available | awk '
    $NF ~ /^com\.apple\.CoreSimulator\.SimRuntime\.iOS-27-/ { runtime = $NF }
    END { print runtime }
  ')"
  if [[ -z "$runtime" ]]; then
    echo 'No available iOS 27 Simulator runtime was found.' >&2
    exit 1
  fi
  device_id="$("${simctl[@]}" create 'CI iPhone 17' com.apple.CoreSimulator.SimDeviceType.iPhone-17 "$runtime")"
  device_state=Shutdown
else
  device_info="$(
    "${simctl[@]}" list devices available |
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
fi

# Finish first-boot migrations before XCTest's application-launch timeout starts.
if [[ "$device_state" != Booted ]]; then "${simctl[@]}" boot "$device_id"; fi
"${simctl[@]}" bootstatus "$device_id" -b

# The Debug fixture uses an in-memory store and makes no backend or Auth0 requests.
# Install and start it before XCTest launches its runner, paying the cold app startup once.
"${simctl[@]}" install "$device_id" "$root/apps/ios/.derivedData/Build/Products/Debug-iphonesimulator/SPrivate.app"
"${simctl[@]}" launch "$device_id" ist.s-hirano.s-private -ui-testing-authenticated -ui-testing-list-fixtures

# CI distributes groups across machines. Each group uses one Simulator, avoiding
# cloned devices competing for CPU, memory and the fixture app's App Group.
xcodebuild test-without-building \
  -xctestrun "${runs[0]}" \
  -destination "platform=iOS Simulator,id=$device_id" \
  -destination-timeout 60 \
  -parallel-testing-enabled NO \
  -resultBundlePath "$result_directory/Tests.xcresult" \
  ${xcodebuild_options[@]+"${xcodebuild_options[@]}"} \
  ${selection[@]+"${selection[@]}"}
