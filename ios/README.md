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

## Build, test, and run

```bash
mise run ios:build
mise run ios:test
mise run ios:run
```

`ios:run` locates an available iPhone 17 in an iOS 27 runtime, boots it, opens
Xcode 27 Device Hub, builds the application without code signing, installs it,
and launches it. Simulator UUIDs are never stored in the repository.

The script intentionally does not shut down the simulated device. Xcode 27
replaced the standalone Simulator app with Device Hub. Open it from Xcode >
Open Developer Tool > Device Hub, or run `mise run ios:run` again; the command
opens Device Hub, boots the matching device, rebuilds, installs, and launches
the app.

## Personal Team device signing

1. In Xcode > Settings > Accounts, add the Apple ID used by the Personal Team.
2. Copy `ios/Config/Local.xcconfig.example` to
   `ios/Config/Local.xcconfig` and set `IOS_DEVELOPMENT_TEAM` to the Team ID.
   `Local.xcconfig` is ignored by Git.
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
in Keychain. No client secret is used. Create a separate **Native** application
and API in Auth0, then set these local values:

```xcconfig
AUTH0_CLIENT_ID = <Native Application client ID>
AUTH0_DOMAIN = <tenant>.auth0.com
AUTH0_AUDIENCE = https:/$()/<API identifier>
MOBILE_API_BASE_URL = https:/$()/<origin>/api/mobile/v1
```

Xcconfig treats `//` as a comment, so URL values use `https:/$()/...`; the
expanded Info.plist contains the normal `https://...` value.

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
one or more images from Photos to SPrivate. Confirm the extension, then open the
main app. The items should appear under **共有された項目**. The extension writes
an operation directory atomically to the App Group; the app moves it to the
imported area so the same operation is not imported twice.

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

The native domain screens, SwiftData queue, background synchronization, and
Share Extension registration flow remain later milestones.

## Mobile API server configuration

The server exposes `/api/mobile/v1` for the existing Auth0 native client. Set
`MOBILE_API_AUDIENCE` to the Auth0 API identifier used by `AUTH0_AUDIENCE` in
`Local.xcconfig`. Keep this value in `.env.local` locally and Vercel Dashboard
for Preview/Production. The API refuses requests when it is missing. Each
Auth0 `sub` must already be linked to a Better Auth `Account` with
`providerId=auth0`; the API resolves that account's user ID and isolates data
by that user. The API never creates or merges users.

The HTTP contract is [mobile-v1.openapi.yaml](../docs/openapi/mobile-v1.yaml).
The current whole-request upload limit is 1 MiB per image or cover; resumable
chunked uploads and durable operation-ID deduplication are later milestones.
Until those exist, do not automatically retry an ambiguous create response.

## Device smoke-test result

The repository owner confirmed on a physical iPhone that the Personal Team
build installs, Auth0 login returns to the app, and shared items reach the
main app through the Share Extension and App Group. This confirms the minimal
device integration only; server synchronization and full domain flows remain
unimplemented.
