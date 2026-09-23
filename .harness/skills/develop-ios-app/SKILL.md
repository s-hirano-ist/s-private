---
name: develop-ios-app
description: ios/配下のSwiftUIアプリを実装、改修、ビルド、テスト、Simulatorデバッグするときに、既存のXcodeGen構成とモバイルAPI境界を保ちながらCLI-firstで作業する。
---

# Develop iOS App

OpenAIの「[Build for iOS](https://learn.chatgpt.com/use-cases/native-ios-apps)」の知見を、このリポジトリの既存iOSアプリに適用する。

## 作業前の確認

1. `git rev-parse --show-toplevel`で現在のworktreeルートを取得し、以後はそのルート内だけを対象にする。主checkoutや別worktreeの絶対パスを流用しない。
2. `ios/README.md`、`ios/project.yml`、`.mise.toml`を確認する。認証、共有、Mobile APIを変更するときだけ、`docs/architecture.md`のiOS節と`docs/openapi/mobile-v1.yaml`も読む。
3. UIを変更する場合は、現在のworktreeで`pnpm exec storybook skills stories`を実行し、コンポーネントやstoryを編集する場合は`pnpm exec storybook skills write-story`も実行する。SwiftUI固有の設計・性能・デバッグには`Build iOS Apps` pluginのskillを併用する。

## プロジェクトの不変条件

- これはgreenfieldではなく、SwiftUI + XcodeGenの既存プロジェクトである。
- `ios/project.yml`をXcodeプロジェクトの正本とする。生成された`ios/SPrivate.xcodeproj`は直接編集せず、Gitにも追加しない。
- Tuistなど別のproject generatorへ移行しない。既存の`mise run ios:*` taskを優先する。
- schemeは`SPrivate`、既定のSimulatorはiPhone 17 / iOS 27である。iPad、macOS、共有Apple-platform抽象化は明示依頼なしに追加しない。
- Simulator buildでもApp GroupとKeychainを使うため、既存のad hoc signing設定を保つ。`CODE_SIGNING_ALLOWED=NO`へ変更しない。
- Auth0はNative ApplicationのAuthorization Code + PKCEを使い、client secretをアプリへ置かない。
- Share Extensionは資格情報や通信を持たず、App Groupへ原子的に書き込む。main appによるoperation ID単位の重複防止を壊さない。
- `/api/mobile/v1`ではBearer認証、所有者検証、tenant context、既存ユースケースとドメインルールを共有する。
- createの応答が曖昧な場合は自動再試行しない。対象一覧を更新し、作成済みか確認してから再送する。

## CLI-firstの進め方

狭い検証から始め、通過後にだけ範囲を広げる。

1. Swiftの対象テスト、または対象targetのbuildを実行する。
2. プロジェクト定義を変更した場合は`mise run ios:generate`を実行する。
3. Simulator向けコンパイルは`mise run ios:build`、単体・UIテストは`mise run ios:test`を使う。
4. 実行確認が必要な場合だけ`mise run ios:run`を使う。
5. scheme、target、Simulator、ログ、スクリーンショット、UI操作が必要ならXcodeBuildMCPを使う。project pathには現在のworktree内の`ios/SPrivate.xcodeproj`を指定する。

XcodeBuildMCPが利用できない場合でも、shellの`xcodebuild`または既存Mise taskで実行可能な検証は継続し、不足する視覚・対話検証だけを明示する。

## worktree運用

- Xcode projectと`ios/.derivedData`は各worktree内で生成する。他worktreeの生成物を共有しない。
- `ios/Config/Local.xcconfig`はGit管理外なので、共有設定と異なる値が必要なworktreeにだけ個別作成する。
- 複数worktreeで同じSimulatorとbundle IDを同時に使うと、インストール済みアプリが上書きされる。Simulatorを分けるか実行を直列化し、起動前に必ず現在のworktreeからbuild・installする。
- Simulator UUIDやworktree固有の絶対パスをGit管理ファイルへ保存しない。

## 完了条件

- 変更した契約を証明する最小のテストと、変更内容に応じた`mise run ios:build`または`mise run ios:test`が成功している。
- リポジトリのコードを変更した場合は`pnpm check:agent`も成功している。
- 完了報告に、使用したscheme、target、Simulator、実行コマンド、視覚確認の有無、未検証事項を記載する。
