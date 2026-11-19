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
  SPrivateUITests/SPrivateUITests/testArticleAndNoteRowsShowLongTitlesAndOpenDetails
)
selection=()
case "$group" in
  all) ;;
  unit) selection+=(-only-testing:SPrivateTests) ;;
  rss) selection+=(-only-testing:SPrivateUITests/RssUITests) ;;
  navigation)
    for identifier in "${navigation[@]}"; do selection+=("-only-testing:$identifier"); done
    ;;
  ui)
    selection+=(-only-testing:SPrivateUITests -skip-testing:SPrivateUITests/RssUITests)
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

# CI distributes groups across machines. Each group uses one Simulator, avoiding
# cloned devices competing for CPU, memory and the fixture app's App Group.
xcodebuild test-without-building \
  -xctestrun "${runs[0]}" \
  -destination 'platform=iOS Simulator,name=iPhone 17,OS=latest' \
  -destination-timeout 60 \
  -parallel-testing-enabled NO \
  -resultBundlePath "$result_directory/Tests.xcresult" \
  ${selection[@]+"${selection[@]}"}
