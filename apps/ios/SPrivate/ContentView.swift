import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var authentication: AuthenticationModel
    @EnvironmentObject private var sharedInbox: SharedInboxModel
    @EnvironmentObject private var sync: SyncCoordinator

    var body: some View {
        Group {
            if authentication.status == .authenticated {
                TabView {
                    ForEach([MobileDomain.articles, .notes, .images, .books]) { domain in
                        DomainListView(domain: domain)
                            .tabItem { Label(domain.title, systemImage: domain.symbol) }
                    }
                }
            } else {
                NavigationStack {
                    List {
                        authenticationContent
                    }
                    .scrollContentBackground(.hidden)
                    .background(AppColors.background)
                    .foregroundStyle(AppColors.foreground)
                    .navigationTitle("Memdex")
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
            .foregroundStyle(AppColors.primary)
            .accessibilityIdentifier("auth0-login-button")
        case .working:
            ProgressView(String(localized: "処理中"))
        case .authenticated:
            EmptyView()
        case let .error(message):
            Label(String(localized: "認証に失敗しました"), systemImage: "xmark.circle")
            Text(message).foregroundStyle(AppColors.mutedForeground)
            Button(String(localized: "再試行")) { Task { await authentication.logIn() } }
                .foregroundStyle(AppColors.primary)
        }
    }
}

struct SettingsView: View {
    @EnvironmentObject private var authentication: AuthenticationModel
    @EnvironmentObject private var sharedInbox: SharedInboxModel
    @EnvironmentObject private var sync: SyncCoordinator
    @State private var confirmingLogout = false
    @State private var confirmingCacheClear = false

    var body: some View {
        List {
            Section(String(localized: "認証")) {
                Label(String(localized: "ログイン済み"), systemImage: "checkmark.circle")
                if let error = authentication.logoutError {
                    Text(error).foregroundStyle(AppColors.destructive)
                }
                Button(role: .destructive) {
                    if sync.pendingCount == 0 { Task { await authentication.logOut() } }
                    else { confirmingLogout = true }
                } label: {
                    if authentication.isLoggingOut { ProgressView() }
                    else { Text(String(localized: "ログアウト")) }
                }
                .foregroundStyle(AppColors.destructive)
                .disabled(authentication.isLoggingOut || sync.isSynchronizing)
            }
            Section(String(localized: "同期")) {
                NavigationLink {
                    SyncManagementView()
                } label: {
                    LabeledContent(String(localized: "同期管理"), value: String(sync.pendingCount))
                }
                .accessibilityIdentifier("sync-management-link")
                Button {
                    Task { await sync.synchronize(force: true) }
                } label: {
                    if sync.isSynchronizing { ProgressView() }
                    else { Text(String(localized: "今すぐ同期")) }
                }
                    .foregroundStyle(AppColors.primary)
                    .disabled(sync.isSynchronizing)
                Button(String(localized: "キャッシュを削除"), role: .destructive) { confirmingCacheClear = true }
                    .foregroundStyle(AppColors.destructive)
                    .disabled(sync.isSynchronizing)
            }
            Section(String(localized: "共有された項目")) {
                if sharedInbox.items.isEmpty {
                    Text(String(localized: "共有項目はありません"))
                } else {
                    ForEach(sharedInbox.items) { item in
                        Label(item.text ?? item.kind.rawValue, systemImage: "square.and.arrow.down")
                    }
                }
                if let error = sharedInbox.errorMessage { Text(error).foregroundStyle(AppColors.destructive) }
                Button(String(localized: "再読み込み")) { sharedInbox.reload() }
                    .foregroundStyle(AppColors.primary)
            }
            Section(String(localized: "接続先")) {
                Text(Bundle.main.object(forInfoDictionaryKey: "MobileAPIBaseURL") as? String ?? "")
                    .textSelection(.enabled)
            }
        }
        .scrollContentBackground(.hidden)
        .background(AppColors.background)
        .foregroundStyle(AppColors.foreground)
        .accessibilityIdentifier("settings-view")
        .navigationTitle(String(localized: "設定"))
        .confirmationDialog(
            String(localized: "未送信データがあります"),
            isPresented: $confirmingLogout,
            titleVisibility: .visible
        ) {
            Button(String(localized: "同期してログアウト")) {
                Task { await sync.synchronize(force: true); if sync.pendingCount == 0 { await authentication.logOut() } }
            }
            Button(String(localized: "破棄してログアウト"), role: .destructive) {
                sync.discardPending()
                Task { await authentication.logOut() }
            }
            Button(String(localized: "キャンセル"), role: .cancel) {}
        } message: {
            Text(String(localized: "未送信データを同期するか破棄してください。"))
        }
        .alert(
            String(localized: "キャッシュを削除しますか？"),
            isPresented: $confirmingCacheClear
        ) {
            Button(String(localized: "キャッシュを削除"), role: .destructive) { sync.clearCache() }
            Button(String(localized: "キャンセル"), role: .cancel) {}
        } message: {
            Text(String(localized: "保存待ちの項目は削除されません。"))
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthenticationModel())
        .environmentObject(SharedInboxModel())
}

struct SyncManagementView: View {
    @EnvironmentObject private var sync: SyncCoordinator

    var body: some View {
        List {
            ForEach(sync.pendingOperations()) { operation in
                Section {
                    VStack(alignment: .leading, spacing: 6) {
                        Label(operation.domain.title, systemImage: operation.domain.symbol)
                        Text(operation.state.title).font(.caption).foregroundStyle(AppColors.mutedForeground)
                        if let error = operation.lastError { Text(error).font(.caption).foregroundStyle(AppColors.destructive) }
                        HStack {
                            Button(String(localized: "再送")) { Task { await sync.retry(operation) } }
                                .foregroundStyle(AppColors.primary)
                                .disabled(sync.isSynchronizing)
                            Button(String(localized: "取り消す"), role: .destructive) { sync.cancel(operation) }
                                .foregroundStyle(AppColors.destructive)
                                .disabled(sync.isSynchronizing)
                        }
                    }
                    if operation.state == .needsAttention {
                        NavigationLink(String(localized: "内容を修正")) { PendingOperationEditor(operation: operation) }
                            .disabled(sync.isSynchronizing)
                    }
                }
            }
            if sync.pendingCount == 0 {
                ContentUnavailableView(String(localized: "未送信データはありません"), systemImage: "checkmark.circle")
            }
        }
        .scrollContentBackground(.hidden)
        .background(AppColors.background)
        .foregroundStyle(AppColors.foreground)
        .navigationTitle(String(localized: "同期管理"))
        .accessibilityIdentifier("sync-management-view")
        .toolbar {
            Button(String(localized: "今すぐ同期")) { Task { await sync.synchronize(force: true) } }
                .disabled(sync.isSynchronizing)
        }
    }
}

struct PendingOperationEditor: View {
    let operation: PendingMobileOperation
    @EnvironmentObject private var sync: SyncCoordinator
    @Environment(\.dismiss) private var dismiss
    @State private var title: String
    @State private var url: String
    @State private var category: String
    @State private var quote: String
    @State private var markdown: String
    @State private var isbn: String
    @State private var rating: Int
    @State private var tags: String
    @State private var errorMessage: String?

    init(operation: PendingMobileOperation) {
        self.operation = operation
        let input = (try? JSONDecoder().decode(MobileCreate.self, from: operation.payload))
            ?? MobileCreate(operationId: operation.operationID, title: "")
        _title = State(initialValue: input.title)
        _url = State(initialValue: input.url ?? "")
        _category = State(initialValue: input.category ?? "")
        _quote = State(initialValue: input.quote ?? "")
        _markdown = State(initialValue: input.markdown ?? "")
        _isbn = State(initialValue: input.isbn ?? "")
        _rating = State(initialValue: input.rating ?? 1)
        _tags = State(initialValue: input.tags ?? "")
    }

    var body: some View {
        Form {
            if let errorMessage { Text(errorMessage).foregroundStyle(AppColors.destructive) }
            if operation.domain != .images { TextField(String(localized: "タイトル"), text: $title) }
            if operation.domain == .articles {
                TextField("URL", text: $url).keyboardType(.URL)
                ArticleCategoryField(name: $category, categories: sync.cachedCategories())
                TextField(String(localized: "引用"), text: $quote)
            } else if operation.domain == .notes {
                TextField("Markdown", text: $markdown, axis: .vertical)
            } else if operation.domain == .books {
                TextField("ISBN", text: $isbn)
                Picker(String(localized: "評価"), selection: $rating) {
                    ForEach(1...5, id: \.self) { Text(String($0)).tag($0) }
                }
                TextField(String(localized: "タグ（カンマ区切り）"), text: $tags)
            }
        }
        .scrollContentBackground(.hidden)
        .background(AppColors.background)
        .foregroundStyle(AppColors.foreground)
        .navigationTitle(String(localized: "内容を修正"))
        .toolbar {
            Button(String(localized: "保存")) {
                let revised = MobileCreate(
                    operationId: UUID(), title: title,
                    url: operation.domain == .articles ? url : nil,
                    category: operation.domain == .articles ? ArticleCategoryName.normalized(category) : nil,
                    quote: operation.domain == .articles ? quote : nil,
                    markdown: operation.domain == .notes ? markdown : nil,
                    isbn: operation.domain == .books ? isbn : nil,
                    rating: operation.domain == .books ? rating : nil,
                    tags: operation.domain == .books ? tags : nil
                )
                do {
                    try sync.revise(operation, input: revised)
                    dismiss()
                } catch {
                    errorMessage = MobileOperationError.message(error)
                }
            }
            .disabled(operation.domain == .articles && !ArticleCategoryName.isValid(category))
        }
    }
}
