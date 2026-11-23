import SwiftUI

struct ArticleLinkRow<Content: View>: View {
    let id: String
    var onDeleted: () -> Void = {}
    @ViewBuilder let label: () -> Content
    @Environment(\.openURL) private var openURL
    @EnvironmentObject private var authentication: AuthenticationModel
    @EnvironmentObject private var sync: SyncCoordinator
    @State private var confirmingDelete = false
    @State private var deleting = false
    @State private var errorMessage: String?
    #if DEBUG
    @Environment(\.articleDeleteFailureFixtureID) private var articleDeleteFailureFixtureID
    #endif

    var body: some View {
        Button {
            openURL.openArticle(sync.cachedRecord(domain: .articles, id: id)) {
                errorMessage = String(localized: "記事のリンクを開けません")
            }
        } label: {
            label().contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(deleting)
        .swipeActions(allowsFullSwipe: false) {
            Button(String(localized: "削除"), systemImage: "trash") { confirmingDelete = true }
                .tint(AppColors.destructive)
                .disabled(deleting)
        }
        .confirmationDialog(String(localized: "この項目を削除しますか？"), isPresented: $confirmingDelete, titleVisibility: .visible) {
            Button(String(localized: "削除"), role: .destructive) { Task { await delete() } }
                .accessibilityIdentifier("article-delete-confirm")
            Button(String(localized: "キャンセル"), role: .cancel) {}
        }
        .alert(errorMessage ?? "", isPresented: Binding(
            get: { errorMessage != nil },
            set: { if !$0 { errorMessage = nil } }
        )) {
            Button("OK", role: .cancel) {}
        }
    }

    private func delete() async {
        guard !deleting else { return }
        let owner = authentication.ownerKey
        deleting = true
        defer { deleting = false }
        do {
            try await deleteFromServer()
            guard owner == authentication.ownerKey else { return }
            sync.removeCached(domain: .articles, id: id)
            onDeleted()
        } catch {
            guard owner == authentication.ownerKey else { return }
            errorMessage = MobileOperationError.message(error, taskIsCancelled: Task.isCancelled)
        }
    }

    private func deleteFromServer() async throws {
        #if DEBUG
        if let articleDeleteFailureFixtureID {
            if id == articleDeleteFailureFixtureID { throw URLError(.notConnectedToInternet) }
            return
        }
        #endif
        try await MobileClient(authentication: authentication).delete(.articles, id: id)
    }
}

extension OpenURLAction {
    func openArticle(_ record: MobileRecord?, onFailure: @escaping () -> Void) {
        guard let address = record?.url, let url = URL(string: address),
              ["http", "https"].contains(url.scheme?.lowercased() ?? ""), url.host != nil else {
            onFailure()
            return
        }
        self(url) { accepted in
            if !accepted { onFailure() }
        }
    }
}

#if DEBUG
extension EnvironmentValues {
    @Entry var articleDeleteFailureFixtureID: String? = nil
}
#endif
