# iOS Development

`ios/project.yml` is the source of truth for the Xcode project. The generated
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

The repository provides the `develop-ios-app` skill for changes under `ios/`.
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
worktree. Each worktree keeps its generated project and `ios/.derivedData`
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
   `ios/Config/Shared.xcconfig`, so no per-worktree setup is needed. To use a
   different Apple team or API environment, copy
   `ios/Config/Local.xcconfig.example` to `ios/Config/Local.xcconfig` and
   override only the values you need. `Local.xcconfig` is ignored by Git.
3. Run `mise run ios:generate`, open `ios/SPrivate.xcodeproj`, select the
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
MOBILE_API_BASE_URL = https:/$()/<origin>/api/mobile/v1
```

Xcconfig treats `//` as a comment, so URL values use `https:/$()/...`; the
expanded Info.plist contains the normal `https://...` value.
`AUTH0_AUDIENCE` is the Auth0 API identifier and must match the server's
`MOBILE_API_AUDIENCE`; it does not need to be the API host. For the current
production deployment, set `MOBILE_API_BASE_URL` to
`https:/$()/private.s-hirano.com/api/mobile/v1`. The `s-hirano.com` host serves
a separate site and returns an HTML 404 for mobile API routes.

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
search read the local copy immediately, including offline. At launch, login and
foreground activation, and periodically while active, the app compares the complete owner-scoped manifest and
fetches only new or changed records. It removes remote deletions only after all
changed details have been fetched successfully. Foreground checks are throttled
to five minutes; manual sync always checks. Images and book covers are saved as
thumbnails for offline display. Originals are fetched on demand. **キャッシュを削除**
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

The native online screens now cover articles, notes, books, images, and search.
Sign in and configure `MOBILE_API_BASE_URL` before using them. Lists support
status filtering and pagination; new records use the existing mobile API.
The bottom tab bar contains articles, notes, books, and images in that order.
Each list opens cross-domain search from its top toolbar. Settings is available
from the Search toolbar and still shows shared inbox
items from the feasibility test.
Markdown is rendered with native SwiftUI views and no WebView.

The native screens support a full local SwiftData copy and registration queue,
resumable uploads, durable create deduplication, and Share Extension registration.
Background execution while the app is terminated is not guaranteed.

Repository instructions require Storybook MCP before UI work, but that MCP
server was not exposed to this implementation session. No React UI was changed.

## Mobile API server configuration

The server exposes `/api/mobile/v1` for the existing Auth0 native client. Set
`MOBILE_API_AUDIENCE` to the Auth0 API identifier used by `AUTH0_AUDIENCE` in
`Local.xcconfig`. Keep this value in `.env.local` locally and Vercel Dashboard
for Preview/Production. The API refuses requests when it is missing. Each
Auth0 `sub` must already be linked to a Better Auth `Account` with
`providerId=auth0`; the API resolves that account's user ID and isolates data
by that user. The API never creates or merges users.

The HTTP contract is [mobile-v1.openapi.yaml](../docs/openapi/mobile-v1.yaml).
Images and covers use `/uploads` sessions with 1 MiB chunks and a 10 MiB total
limit. Upload sessions expire after 24 hours. Reusing an operation ID with
different input is rejected with `OPERATION_CONFLICT`.

## Device smoke-test result

The repository owner confirmed on a physical iPhone that the Personal Team
build installs, Auth0 login returns to the app, and shared items reach the
main app through the Share Extension and App Group. This confirms the minimal
device integration. The current offline/sync flow must still be smoke-tested on
the owner's physical device after each Personal Team re-signing.
