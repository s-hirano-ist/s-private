import SwiftUI

struct ArticleListLabel: View {
    let record: MobileRecord
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        HStack(alignment: .top, spacing: AppLayout.medium) {
            if let thumbnailURL {
                RssThumbnailView(url: thumbnailURL)
            }
            VStack(alignment: .leading, spacing: AppLayout.small) {
                Text(record.displayTitle)
                    .font(.headline)
                    .lineLimit(dynamicTypeSize.isAccessibilitySize ? nil : 2)
                if let address = nonblank(record.url) {
                    Text(verbatim: address)
                        .font(.caption)
                        .foregroundStyle(AppColors.mutedForeground)
                        .lineLimit(dynamicTypeSize.isAccessibilitySize ? nil : 1)
                        .truncationMode(.middle)
                }
                ViewThatFits(in: .horizontal) {
                    HStack(spacing: AppLayout.small) { metadata }
                    VStack(alignment: .leading, spacing: AppLayout.tiny) { metadata }
                }
                .font(.caption)
                .foregroundStyle(AppColors.mutedForeground)
                if let summary {
                    Text(summary)
                        .font(.subheadline)
                        .foregroundStyle(AppColors.mutedForeground)
                        .lineLimit(dynamicTypeSize.isAccessibilitySize ? nil : 2)
                }
            }
            .multilineTextAlignment(.leading)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    @ViewBuilder
    private var metadata: some View {
        if let category = nonblank(record.categoryName) { Text(category) }
        Text(record.createdAt, style: .date)
    }

    private var summary: String? {
        let ogTitle = nonblank(record.ogTitle)
        let alternateTitle = ogTitle == nonblank(record.displayTitle) ? nil : ogTitle
        return nonblank(record.ogDescription) ?? nonblank(record.quote) ?? alternateTitle
    }

    private var thumbnailURL: URL? {
        guard let address = nonblank(record.ogImageUrl), let url = URL(string: address),
              url.scheme?.lowercased() == "https", url.host != nil else { return nil }
        return url
    }

    private func nonblank(_ value: String?) -> String? {
        guard let trimmed = value?.trimmingCharacters(in: .whitespacesAndNewlines), !trimmed.isEmpty else { return nil }
        return trimmed
    }
}

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
