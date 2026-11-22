# iOS Development

The local semantic search, Apple Intelligence, Siri, and App Intents design is
documented in [iOS local intelligence](../../docs/ios-local-intelligence.md).

`apps/ios/project.yml` is the source of truth for the Xcode project. The generated
`SPrivate.xcodeproj` is intentionally excluded from Git.

## Requirements

- Apple silicon Mac
- macOS 27 or later
- Xcode 27 with the iOS 27 Simulator runtime
- Mise

Install Xcode 27 from the Mac App Store, then initialize and select it:

```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -runFirstLaunch
xcodebuild -downloadPlatform iOS -buildVersion 27.0
```

Within this repository, Mise also sets `DEVELOPER_DIR` to the standard Xcode
installation path. The iOS tasks therefore use Xcode 27 even before the global
`xcode-select` setting is changed.

Install the repository-managed tools and generate the project:

```bash
mise install
mise run ios:generate
```

## Codex skills and Simulator automation

The repository provides the `develop-ios-app` skill for changes under `apps/ios/`.
Its canonical source is `.harness/skills/develop-ios-app`; the checked-in
adapter links make it available after cloning and in every Git worktree.

The repo-local `s-private` plugin marketplace installs and enables OpenAI's
`Build iOS Apps` plugin. The plugin supplies focused SwiftUI skills and
XcodeBuildMCP for scheme discovery, Simulator control, logs, screenshots, and
UI automation. On first use, trust the project, allow the pinned plugin source
to download, and start a new Codex conversation (or restart the ChatGPT desktop
app). Network access is also required when the plugin first obtains its
XcodeBuildMCP npm package.

The marketplace pins the OpenAI plugin repository by commit SHA. To upgrade,
review the upstream `build-ios-apps` plugin, update the SHA in
`.agents/plugins/marketplace.json`, and verify the plugin from a new
conversation. Do not replace the repo marketplace with a developer-specific
home-directory configuration. The project configuration disables a separately
installed universal-directory copy while this repository is open so the same
skills and MCP server are not loaded twice.

All commands and XcodeBuildMCP project paths must resolve from the current
worktree. Each worktree keeps its generated project and `apps/ios/.derivedData`
locally. Do not reuse an absolute path from the primary checkout. Multiple
worktrees using the same Simulator and bundle identifier overwrite the same
installed app, so use separate Simulators or serialize runs and rebuild from
the intended worktree immediately before launch.

## Build, test, and run

```bash
mise run ios:build
mise run ios:test
mise run ios:run
```

`ios:test` generates the project once, builds the app and both test targets with
`build-for-testing` for the Apple silicon Simulator architecture (`arm64`), then runs them with `test-without-building`. To rerun tests
without code changes, use `mise run ios:test:run`; after changes, use
`mise run ios:test:build` first. All products and `.xctestrun` specifications stay
inside this worktree's `.derivedData`. Each run saves an `.xcresult` bundle under
`apps/ios/.test-results/`. Before XCTest starts, the runner waits for the selected
Simulator to finish booting and starts the Debug fixture app once with its
in-memory store and network disabled. Preparation and testing use the same device
ID. Set `IOS_SIMULATOR_UDID` to use a separate available iOS 27 Simulator when
running tests alongside another worktree.

CI builds those products once, preserves executable permissions and symlinks in
a tar archive, and distributes them to five independent iPhone 17 / iOS 27 jobs:
unit tests, RSS UI tests, navigation/list-layout UI cases, loading-layout UI tests,
and the remaining UI cases. Loading-layout tests run separately so cold startup
and media gestures fit within each job's timeout. The two text-list layout cases
share the navigation group to balance
the observed XCTest animation waits across jobs. Each test job allows 20 minutes
including cold Simulator startup. Navigation and list-layout tests use in-memory
fixtures, so they do not start live synchronization while XCTest waits for the
app to become idle.
`IOS_TEST_GROUP=unit|rss|navigation|ui|layout mise run ios:test:run` selects the
same groups locally. The default runs all tests. Each job uses one Simulator;
there is no extra Xcode test-worker cloning. API-package tests still run on the
build job. The existing `build-and-test` check requires all jobs to pass.

`node --test scripts/ios-test-groups.test.mjs` checks that every UI test belongs
to exactly one CI group. Newly added UI cases enter the remaining UI group
unless assigned explicitly. CI retains test result bundles, including failure
screenshots, for seven days. This enables timing comparisons and failure diagnosis
without repeating the entire suite.

`ios:run` locates an available iPhone 17 in an iOS 27 runtime, boots it, opens
Xcode 27 Device Hub, builds the application with ad hoc Simulator signing, installs it,
and launches it. Simulator UUIDs are never stored in the repository.

The script intentionally does not shut down the simulated device. Xcode 27
replaced the standalone Simulator app with Device Hub. Open it from Xcode >
Open Developer Tool > Device Hub, or run `mise run ios:run` again; the command
opens Device Hub, boots the matching device, rebuilds, installs, and launches
the app.

Simulator builds and tests use ad hoc signing so the app can access its App Group
and default Keychain. Running `xcodebuild` with `CODE_SIGNING_ALLOWED=NO` can
produce `errSecMissingEntitlement` during credential storage and prevent App
Group access. The iOS tests check both capabilities. Device builds continue to
use the Personal Team configuration below.

## Personal Team device signing

1. In Xcode > Settings > Accounts, add the Apple ID used by the Personal Team.
2. The shared Auth0, API, and Personal Team values are already in
   `apps/ios/Config/Shared.xcconfig`, so no per-worktree setup is needed. To use a
   different Apple team or API environment, copy
   `apps/ios/Config/Local.xcconfig.example` to `apps/ios/Config/Local.xcconfig` and
   override only the values you need. `Local.xcconfig` is ignored by Git.
3. Run `mise run ios:generate`, open `apps/ios/SPrivate.xcodeproj`, select the
   physical iPhone, and run the `SPrivate` scheme. To verify compilation from
   the command line, run `mise run ios:device-build`.
4. Confirm that Signing & Capabilities lists the App Group
   `group.ist.s-hirano.s-private` for both `SPrivate` and
   `SPrivateShareExtension`.

Free provisioning profiles expire after seven days. Re-run the app from Xcode
with the same bundle identifiers to re-sign it without intentionally deleting
the App Group container. Back up any unsent shared items before removing the
app, because uninstalling can remove its local containers.

If the Personal Team cannot provision the App Group or Share Extension, do not
change identifiers or remove the capability. Record the Xcode signing error so
the project can explicitly decide whether to use a paid team or reduce scope.

## Auth0 native application

The app uses Auth0.swift with Authorization Code + PKCE and stores credentials
in Keychain. No client secret is used. The repository already supplies its
Native application and API identifiers in `Shared.xcconfig`. For another Auth0
environment, override these values in `Local.xcconfig`:

```xcconfig
AUTH0_CLIENT_ID = <Native Application client ID>
AUTH0_DOMAIN = <tenant>.auth0.com
AUTH0_AUDIENCE = https:/$()/<API identifier>
MOBILE_API_BASE_URL = https:/$()/<origin>/api/v1
```

Xcconfig treats `//` as a comment, so URL values use `https:/$()/...`; the
expanded Info.plist contains the normal `https://...` value.
`AUTH0_AUDIENCE` is the Auth0 API identifier and must match the server's
`MOBILE_API_AUDIENCE`; it does not need to be the API host. For the current
production deployment, set `MOBILE_API_BASE_URL` to
`https:/$()/private.s-hirano.com/api/v1`. The `s-hirano.com` host serves
a separate site and returns an HTML 404 for mobile API routes.

To verify API communication on a physical iPhone, deploy the corresponding
`/api/v1` changes to Production before running the app against this URL.

For the current bundle identifier and custom URL scheme, add this value to both
**Allowed Callback URLs** and **Allowed Logout URLs** in the Native Application:

```text
ist.s-hirano.s-private://<AUTH0_DOMAIN>/ios/ist.s-hirano.s-private/callback
```

Enable Refresh Token and Authorization Code grant types for the Native
Application, and enable offline access for the API. Universal Links are not
used because Auth0 requires a paid Apple Developer account for that setup.

## Share Extension smoke test

After installing the signed app, share a URL from Safari, text from an app, or
one or more images from Photos to SPrivate. Enter the title/category requested
by the confirmation sheet and save it. The extension only writes an operation
directory atomically to the App Group; it never reads credentials or contacts
the server. Opening the main app imports each operation exactly once into the
persistent sync queue and sends it when a connection and valid login exist.

## Offline data and synchronization

All new records are written to SwiftData before transmission. **設定 > 同期管理**
shows items that are waiting, sending, need correction, or need authentication.
Use **再送** after correcting connectivity/authentication, or **取り消す** to
remove an unsent item. Network failures are retried at most three times per
manual/foreground sync pass. A server validation or operation conflict always
requires user action.

All records and categories are retained in SwiftData. Lists, details, filters and
search read the local copy immediately, including offline. The first sync captures
an owner-scoped change version, downloads keyset pages for each domain and
category, then replays newer changes. Later checks request only ordered changes,
including deletions. The cursor is persisted after each applied page, so a failed
page can be safely repeated. Foreground checks are throttled to five minutes;
manual sync always checks. Lists load 30 local records at a time, and details
read one record by ID. Thumbnails are saved to disk in small background batches
after synchronization and load when visible; originals are fetched on demand. **キャッシュを削除**
removes downloaded records and media but never pending operations or attachments.
Deletion remains online-only.

Images and book covers are normalized to JPEG and uploaded in resumable 1 MiB
chunks, up to the existing 10 MiB limit. The server records each operation ID
and returns the original resource for an identical retry, so losing a response
does not create a second record.

## Troubleshooting

- If `xcodebuild` points at `/Library/Developer/CommandLineTools`, run the
  `xcode-select` command above. Command Line Tools alone cannot build iOS apps.
- If no iOS 27 runtime is available, run the `xcodebuild -downloadPlatform`
  command above or install it from Xcode > Settings > Components.
- If Xcode reports an unaccepted license or missing first-launch components,
  rerun `sudo xcodebuild -runFirstLaunch`.
- The GitHub Actions `xcode-27` image is currently a public preview. Local CLI
  verification remains the reference while the hosted image is in preview.
- An **Auth0が未設定です** message is expected when `Local.xcconfig` does not
  contain all three Auth0 values.

The native screens cover articles, notes, books, images, RSS, and search.
Sign in and configure `MOBILE_API_BASE_URL` before using them. Lists support
status filtering and pagination; new records use the generated shared-backend API.
The bottom tab bar contains RSS, articles, notes, images, and books in that order,
matching the Web app. RSS is initially selected after launch or sign-in.
The domain name appears in the tab bar, so list screens have no duplicate title
in the top navigation bar.
The status button uses an eye for exported records and a crossed-out eye for
unexported records, with the current status and next action available to VoiceOver.
Switching flips the list around its vertical axis in 0.4 seconds, replacing the
content at the midpoint with the first 30 locally cached records. The toolbar and
tab bar stay fixed. Switching adds no network wait or spinner; uncached thumbnails
still load independently. Reduce Motion switches immediately without rotation.
Each list opens cross-domain search from its top toolbar. Settings is available
from the Search toolbar and still shows shared inbox
items from the feasibility test.
Markdown is rendered with native SwiftUI views and no WebView.

Article, note, and book details opened from lists support horizontal paging.
The native scroll-style page controller retains current/adjacent detail views
through each interactive transition. Selection commits when the transition
completes; cancelled gestures keep the original item. Sequence changes from
sync or pagination are applied after the gesture settles.
Swipe left for the next item and right for the previous item; endpoints do not
wrap. Lists preserve the domain, status filter, and opening order, loading another
30 cached records near the end. Non-image search results open a detail pager that
follows the submitted result order across domains. Sync removes missing or
filtered-out records without inserting new arrivals into the open sequence.
Delete confirmation captures the selected item; success returns to the originating
list or search. Paging and back navigation pause while deletion is pending.
Media loads only for the current and adjacent pages.

Tapping an image opens a full-screen gallery directly, with close and delete
controls. Swiping follows the current status filter and list order across all
locally cached image metadata, including items beyond the grid's 30-item pages.
The gallery snapshots its IDs on opening; new arrivals appear on the next opening,
and synchronized deletions are removed. Search opens a single-image gallery.
Deleting requires confirmation and selects the next image, or the previous image
at the end; deleting the final image closes the gallery. Failed deletion retains
the image and displays an error.

Image and book-cover previews share the UIKit zooming scroll view. It starts at
the available viewport width while preserving aspect ratio. Tall images scroll
vertically; short images are centered vertically. Pinch zoom ranges from the
initial width to four times that size. While zoomed, panning takes priority over
gallery paging. Changing images or reopening resets zoom. Only current/adjacent
gallery pages load originals, using the existing authenticated media API and disk
cache, with per-page retry. Book covers retain their existing sheet presentation.
Native previews, `ImageGalleryTests`, `ImagePreviewTests`, `ImageGalleryUITests`
and `LoadingLayoutUITests` cover these flows. The gallery UI fixture uses the
production list/viewer with injected media and deletion operations.

Image-preview UI tests verify fit-to-width layout, pinch zoom-in, panning, and
reset when reopening. `ImagePreviewTests` verifies exact zoom limits and the
geometry after zooming out from a panned position for all three image shapes.

The native screens support a full local SwiftData copy and registration queue,
resumable uploads, durable create deduplication, and Share Extension registration.
Background execution while the app is terminated is not guaranteed.

Use the repository Storybook CLI workflows before UI work. Native SwiftUI views
are covered by `#Preview` and XCTest; Storybook contains the Web components and
has no stories for the native RSS views.

## Mobile API server configuration

The server exposes `/api/v1` for the Auth0 native client. Set
`MOBILE_API_AUDIENCE` to the Auth0 API identifier used by `AUTH0_AUDIENCE` in
`Local.xcconfig`. Keep this value in `.env.local` locally and Vercel Dashboard
for Preview/Production. The API refuses requests when it is missing. Each
Auth0 `sub` must already be linked to a Better Auth `Account` with
`providerId=auth0`; the API resolves that account's user ID and isolates data
by that user. The API never creates or merges users.

The HTTP contract is [backend-v1.json](../../docs/openapi/backend-v1.json).
Images and covers use `/uploads` sessions with 1 MiB chunks and a 10 MiB total
limit. Upload sessions expire after 24 hours. Reusing an operation ID with
different input is rejected with `OPERATION_CONFLICT`.

## Device smoke-test result

The repository owner confirmed on a physical iPhone that the Personal Team
build installs, Auth0 login returns to the app, and shared items reach the
main app through the Share Extension and App Group. This confirms the minimal
device integration; it does not confirm that the app exchanges data with the
mobile API. After the corresponding API is deployed to Production, run the
signed app with the Production `MOBILE_API_BASE_URL` on the owner's physical
iPhone. Confirm login, list retrieval, record creation, and synchronization of
queued items, including Share Extension items. Repeat the offline/sync smoke
test after each Personal Team re-signing.

## Generated shared-backend API

`Packages/SPrivateAPI` compiles a client and models from the shared OpenAPI 3.1
contract using pinned Swift OpenAPI Generator, Runtime, and URLSession packages.
`MobileClient` now uses the generated client for every HTTP operation at `/api/v1`.
Device cache/draft models are mapped explicitly and keep their stored format.
The Auth0 audience identifier remains unchanged; it is independent of the API URL.
Update any ignored `Local.xcconfig` override that still points to `/api/mobile/v1`.
Deploy the preceding API PRs before installing this client against Production.
Operation IDs, sync cursors and queued drafts are retained. Legacy CSV tags keep their
original segments for replay; normalization happens in the backend.

Run `pnpm api:generate` from the repository root after changing the Hono/Zod
contract. The Swift generator reads `docs/openapi/backend-v1.json` directly; no copy is
stored in the package. Do not edit this snapshot by hand. Run `pnpm api:check`
to compare the OpenAPI snapshot without modifying it, and
`swift test --package-path apps/ios/Packages/SPrivateAPI --force-resolved-versions`
to test the generated models.

`mise run ios:generate` first runs the pinned generator CLI on the development
host, then runs XcodeGen. Generated Swift sources stay in the current worktree
and are ignored by Git. Xcode links only the generated client and runtime, so the
generator tool itself is never built for iOS and no plugin trust bypass is needed.
Run `mise run ios:generate` before testing the Swift Package on a fresh checkout.

### Swift dependency lockfiles

Both lockfiles are committed: `Packages/SPrivateAPI/Package.resolved` fixes the
host generator and API-package test dependencies; `Package.resolved` fixes the
complete Xcode app graph, including Auth0 and ZIPFoundation. Normal generation,
CI API tests, and CLI app builds require the recorded versions and fail if the
lockfiles no longer satisfy the manifests.

`ios:generate` copies the app lockfile into the generated project's
`project.xcworkspace/xcshareddata/swiftpm/Package.resolved` after XcodeGen runs.
Without that file, Xcode adopts and overwrites the local API package's lockfile.
Its `originHash` includes the local package's absolute path, so it also changes
between Macs and worktrees. The committed app lockfile omits this metadata;
Xcode may write it into the ignored project copy. Package versions and Git
revisions remain committed and are not normalized or discarded.

After intentionally changing dependency manifests, refresh and review both
lockfiles before committing:

```bash
swift package --package-path apps/ios/Packages/SPrivateAPI resolve
mise run ios:generate
xcodebuild -resolvePackageDependencies -project apps/ios/SPrivate.xcodeproj \
  -scheme SPrivate -derivedDataPath apps/ios/.derivedData
sed '/"originHash"/d' \
  apps/ios/SPrivate.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved \
  > apps/ios/Package.resolved
```

Use `swift package update` in place of `resolve` when intentionally updating
eligible transitive dependencies. Export any intentional Xcode dependency changes
before running `ios:generate` again, since generation restores the committed app
lockfile. Run generation, API tests, and an app build after reviewing the update.

## RSS reader

The first tab lists unread and saved RSS links. Opening an unread link in the
system's default browser marks that captured article ID as read when online.
Stars save or remove links independently of the unread list. Filter unread
articles by subscription, reveal 50 more entries by scrolling, or confirm **すべて既読** to mark
all articles in the selected filter as read. Articles arriving afterward are
excluded from that operation; a new-articles button makes them visible.

**設定 > RSSの購読管理** provides subscription creation/removal and Inoreader
ZIP, OPML/XML, and `starred.json` import. Removing a subscription keeps saved
links. ZIP imports extract metadata on the device, discard article bodies,
and send starred links in batches of at most 100. File/expanded-data limits
match the Web importer (50 MiB / 32 MiB); each API payload also respects the
shared two-million-character limit. Completed import counts remain visible
if a later batch fails. Mutations are never automatically resent after an
ambiguous response.

RSS uses the generated `/api/v1/rss` client and a separate SwiftData cache,
without entering content delta sync or its pending-operation queue. Cached metadata is restored on a dedicated actor before network refreshes. On the
first download, leading pages appear immediately and subsequent pages become
available progressively while the remaining metadata downloads. All unread
and saved metadata pages are downloaded while the app is active. A completed
cache is replaced only after every page succeeds; failures retain the previous
complete version. Cache identities include both owner and API endpoint.
Offline browsing shows cached titles, links, dates, and subscription information;
article bodies and thumbnail bytes are not downloaded for offline use. Updates,
saving, and read mutations require connectivity. Opening a cached link offline
does not queue a read operation. **キャッシュを削除** clears RSS metadata too.

Mutations run in a reader-owned serial queue that survives tab/browser navigation.
Different articles remain operable while another article is being saved or marked
read. Repeated reads and save intents are deduplicated. Bulk reads/imports yield
between API batches so interactive article operations can proceed. Successful
read/save/remove mutations update metadata locally without downloading every page.
The save API returns the authoritative saved ID and timestamp, including duplicates.
Deploy the updated backend before installing this iOS version; no database migration
is required for this change.
An ambiguous response is reconciled by reading metadata without resending the write.
A late response after a connectivity interruption requests reconciliation only
within the same owner/cache lifetime; it cannot refill a deleted cache or cross
sign-out/sign-in boundaries.

Unread downloads pin the existing backend `snapshotRevision`, validate returned
offsets and detect deletion-related page shifts. Each synchronization performs one DB metadata download, independently of external feed polling. Concurrent refresh gestures join
one pass. JSON encoding/decoding and SwiftData commits run off the main actor;
cache generations are fenced against cancelled writes. Filtering/source lookups
update with data/filter changes, independently of polling progress. RSS thumbnails
use four cancellable loaders, a 5 MiB response limit, display-sized ImageIO decoding
and a 20 MiB memory cache; they are not persisted to disk.

Automatic DB checks are throttled to five minutes while the reader is active.
Pull-to-refresh and the toolbar refresh read database metadata only; neither polls
external RSS hosts. The shared Vercel Schedule fetches feeds and commits new articles
independently of Web and iOS screens. Subscription creation and OPML imports wait
for the next server pass to download their first articles. Production requires
the backend `rss-refresh` Schedule, `BACKEND_CRON_ENABLED=true` and `CRON_SECRET`
to be configured as described in [the RSS operations guide](../../docs/rss-reader.md#定期取得の設定と監視).

Pull-to-refresh ends after the selected unread/saved list's first DB page returns.
The remaining offline copy continues in a reader-owned task, with a static sync
status instead of an indefinitely spinning refresh control. Failures, cancellation
and session invalidation release waiting refresh controls. The existing complete
cache remains until every page succeeds. Full-list filtering and initial acceptance
IDs are built off the main actor; obsolete projections cannot overwrite newer
filters or owner identities. Background execution while the app is terminated is
not guaranteed for the device cache.

`RssTests` covers cache generations, pagination/revisions, isolation, read boundaries,
mutation failures, concurrent DB refreshes/reads/saves, reconnects, cache deletion,
partial bulk operations, large datasets, and file imports. `RssUITests` uses an
in-memory RSS server and never calls the configured API. The refresh UI tests use
`-ui-testing-rss-controlled-pages`: the test arms a Debug-only page gate after
initial sync, checks the actual reader while subsequent pages are held, then
explicitly releases them. This avoids racing a short artificial delay. The native
refresh test returns to the top and drags from an article row inside `rss-reader` and confirms a later page is pending before
checking that the spinner ended. SwiftUI previews cover
unread articles, subscription management, and offline browsing.

### RSS performance verification (2026-11-18)

A local Release model harness compared the previous and updated source with
100 subscriptions, 10,000 unread and 10,000 saved entries, and 2 ms of simulated
latency per metadata request. These are local model measurements, not production
network or device results. Both measurements used `swift test --skip-build`
after compiling the harnesses, with peak resident memory from `/usr/bin/time -l`.

| Operation | Previous | Updated |
| --- | --- | --- |
| Initial full metadata download | 1.204 s / 402 GETs | 1.222 s / 402 GETs |
| Mark one article read | 1.223 s | 0.034 s |
| Save one article | 1.207 s | 0.027 s |
| Metadata GETs for those two mutations | 805 | 0 |
| Maximum sampled main-actor wait | 57.9 ms | 1.9 ms |
| Peak resident memory including test startup | 119.8 MiB | 83.3 MiB |

The full offline copy still requires all pages. The improvement removes the full
copy from normal article operations and moves cache processing off the UI actor.
Re-run `RssTests.largeDataset` under the same build configuration to compare
`RSS_BENCH` timings, request counts, and sampled main-actor waits.

The implementation session compiled the iOS app and test targets, exercised RSS
models in a temporary macOS harness, and ran CockroachDB integration tests against
a dedicated local database. Simulator execution was blocked because the installed
CoreSimulator version (1171.7) was older than Xcode's required version (1174.21).
The two delayed-fixture UI tests and thumbnail runtime/layout test must be run with
`mise run ios:test` after repairing that Xcode installation. Physical-device and
post-deployment Sentry verification remain outstanding.

### RSS database refresh verification (2026-11-18)

The DB-only reader change passed the app build and generic iOS Simulator
`build-for-testing` for scheme `SPrivate`, including both test targets.
A temporary macOS harness ran 40 RSS model tests using the current worktree's
model/cache/import sources. It excluded the unrelated content-schema migration
test and replaced only thumbnail-cache clearing with a stub; it does not verify
SwiftUI rendering or UIKit refresh-control behavior. Web verification uses a
separate migrated local DB and covers pagination, thumbnails, saves, imports,
and newly committed articles arriving while the reader keeps its displayed revision.

`mise run ios:test` remains blocked by the CoreSimulator version mismatch
(1171.7 installed versus 1174.21 required). The new slow-page pull-to-refresh UI
test compiles, but Simulator execution, physical-device frame responsiveness,
and post-deployment Schedule operation remain unverified. Configure and verify the
production RSS Schedule before deploying readers that depend on its feed updates.

### RSS infinite scrolling

Unread and saved lists initially render up to 50 entries, then reveal the next
50 as the list tail appears. The full metadata download and offline cache remain
unchanged: scrolling reveals cached entries without extra API calls. Normal sync,
reads and star actions keep the expanded range. Switching lists or subscriptions,
changing accounts, or accepting new arrivals resets to the first 50 entries and
the top of the list. Mark-all-read still includes all accepted entries in the
selected subscription, including entries that have not been revealed yet.
