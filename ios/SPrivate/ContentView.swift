import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var authentication: AuthenticationModel
    @EnvironmentObject private var sharedInbox: SharedInboxModel

    var body: some View {
        NavigationStack {
            List {
                Section("認証") {
                    authenticationContent
                }

                Section("共有された項目") {
                    if sharedInbox.items.isEmpty {
                        ContentUnavailableView(
                            "共有項目はありません",
                            systemImage: "square.and.arrow.down"
                        )
                        .accessibilityIdentifier("empty-shared-inbox")
                    } else {
                        ForEach(sharedInbox.items) { item in
                            SharedInboxRow(item: item)
                        }
                    }

                    if let errorMessage = sharedInbox.errorMessage {
                        Text(errorMessage)
                            .foregroundStyle(.secondary)
                            .accessibilityIdentifier("shared-inbox-error")
                    }
                }
            }
            .navigationTitle("SPrivate")
            .toolbar {
                Button("再読み込み", systemImage: "arrow.clockwise") {
                    sharedInbox.reload()
                }
            }
        }
    }

    @ViewBuilder
    private var authenticationContent: some View {
        switch authentication.status {
        case .unavailable:
            Label("Auth0が未設定です", systemImage: "exclamationmark.triangle")
                .accessibilityIdentifier("auth0-unconfigured-message")
            Text("ios/Config/Local.xcconfig に接続情報を設定してください。")
                .font(.footnote)
                .foregroundStyle(.secondary)
        case .signedOut:
            Button("Auth0でログイン") {
                Task { await authentication.logIn() }
            }
            .accessibilityIdentifier("auth0-login-button")
        case .working:
            ProgressView("処理中")
        case .authenticated:
            Label("ログイン済み", systemImage: "checkmark.circle")
            Button("ログアウト", role: .destructive) {
                Task { await authentication.logOut() }
            }
        case let .error(message):
            Label("認証に失敗しました", systemImage: "xmark.circle")
            Text(message)
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthenticationModel())
        .environmentObject(SharedInboxModel())
}

private struct SharedInboxRow: View {
    let item: SharedInboxItem

    var body: some View {
        Label {
            VStack(alignment: .leading) {
                Text(item.text ?? item.kind.localizedName)
                    .lineLimit(2)
                Text(item.createdAt, format: .dateTime)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        } icon: {
            Image(systemName: item.kind.systemImage)
        }
        .accessibilityIdentifier("shared-inbox-item")
    }
}

private extension SharedInboxItemKind {
    var localizedName: String {
        switch self {
        case .image: "画像"
        case .text: "テキスト"
        case .url: "URL"
        }
    }

    var systemImage: String {
        switch self {
        case .image: "photo"
        case .text: "text.alignleft"
        case .url: "link"
        }
    }
}
