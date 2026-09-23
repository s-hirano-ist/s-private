import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var authentication: AuthenticationModel
    @EnvironmentObject private var sharedInbox: SharedInboxModel

    var body: some View {
        Group {
            if authentication.status == .authenticated {
                TabView {
                    ForEach(MobileDomain.allCases) { domain in
                        DomainListView(domain: domain)
                            .tabItem { Label(domain.title, systemImage: domain.symbol) }
                    }
                    SearchView()
                        .tabItem { Label(String(localized: "検索"), systemImage: "magnifyingglass") }
                }
            } else {
                NavigationStack {
                    List {
                        authenticationContent
                    }
                    .navigationTitle("SPrivate")
                }
            }
        }
    }

    @ViewBuilder
    private var authenticationContent: some View {
        switch authentication.status {
        case .unavailable:
            ContentUnavailableView(String(localized: "Auth0が未設定です"), systemImage: "exclamationmark.triangle")
                .accessibilityIdentifier("auth0-unconfigured-message")
        case .signedOut:
            Button(String(localized: "Auth0でログイン")) {
                Task { await authentication.logIn() }
            }
            .accessibilityIdentifier("auth0-login-button")
        case .working:
            ProgressView(String(localized: "処理中"))
        case .authenticated:
            EmptyView()
        case let .error(message):
            Label(String(localized: "認証に失敗しました"), systemImage: "xmark.circle")
            Text(message).foregroundStyle(.secondary)
            Button(String(localized: "再試行")) { Task { await authentication.logIn() } }
        }
    }
}

struct SettingsView: View {
    @EnvironmentObject private var authentication: AuthenticationModel
    @EnvironmentObject private var sharedInbox: SharedInboxModel

    var body: some View {
        List {
            Section(String(localized: "認証")) {
                Label(String(localized: "ログイン済み"), systemImage: "checkmark.circle")
                Button(String(localized: "ログアウト"), role: .destructive) {
                    Task { await authentication.logOut() }
                }
            }
            Section(String(localized: "共有された項目")) {
                if sharedInbox.items.isEmpty {
                    Text(String(localized: "共有項目はありません"))
                } else {
                    ForEach(sharedInbox.items) { item in
                        Label(item.text ?? item.kind.rawValue, systemImage: "square.and.arrow.down")
                    }
                }
                if let error = sharedInbox.errorMessage { Text(error).foregroundStyle(.red) }
                Button(String(localized: "再読み込み")) { sharedInbox.reload() }
            }
            Section(String(localized: "接続先")) {
                Text(Bundle.main.object(forInfoDictionaryKey: "MobileAPIBaseURL") as? String ?? "")
                    .textSelection(.enabled)
            }
        }
        .navigationTitle(String(localized: "設定"))
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthenticationModel())
        .environmentObject(SharedInboxModel())
}
