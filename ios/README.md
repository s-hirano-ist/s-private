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

`ios:run` locates an available iPhone 17 in an iOS 27 runtime, boots it, builds
the application without code signing, installs it, and launches it. Simulator
UUIDs are never stored in the repository.

The bundle identifier `ist.s-hirano.s-private` and disabled code signing are
temporary simulator-only settings. Personal Team signing is a later milestone.

## Troubleshooting

- If `xcodebuild` points at `/Library/Developer/CommandLineTools`, run the
  `xcode-select` command above. Command Line Tools alone cannot build iOS apps.
- If no iOS 27 runtime is available, run the `xcodebuild -downloadPlatform`
  command above or install it from Xcode > Settings > Components.
- If Xcode reports an unaccepted license or missing first-launch components,
  rerun `sudo xcodebuild -runFirstLaunch`.
- The GitHub Actions `xcode-27` image is currently a public preview. Local CLI
  verification remains the reference while the hosted image is in preview.

This initial sample intentionally contains no server API, authentication,
SwiftData, Share Extension, or physical-device signing integration.
