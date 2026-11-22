#if DEBUG
import SwiftData
import SwiftUI

private struct DomainListPreview: View {
    let domain: MobileDomain
    var reduceMotion: Bool
    private let authentication: AuthenticationModel
    private let sync: SyncCoordinator

    init(domain: MobileDomain, empty: Bool = false, reduceMotion: Bool = false) {
        self.domain = domain
        self.reduceMotion = reduceMotion
        let authentication = AuthenticationModel()
        let container = try! ModelContainer(
            for: CachedMobileRecord.self, CachedMobileCategory.self, PendingMobileOperation.self, MobileSyncState.self,
            configurations: ModelConfiguration(isStoredInMemoryOnly: true)
        )
        let sync = SyncCoordinator(container: container, authentication: authentication)
        if !empty {
            for status in [MobileContentStatus.exported, .unexported] {
                try! sync.cache(domain: domain, records: [MobileRecord(
                    id: status.rawValue, status: status, createdAt: .now, updatedAt: .now,
                    exportedAt: nil, title: status.localizedTitle, url: nil, quote: nil,
                    categoryId: nil, categoryName: nil, markdown: nil, isbn: nil, rating: nil,
                    tags: nil, path: nil, imagePath: nil, contentType: nil, fileSize: nil
                )])
            }
        }
        self.authentication = authentication
        self.sync = sync
    }

    var body: some View {
        DomainListView(domain: domain, reduceMotionOverride: reduceMotion ? true : nil)
            .environmentObject(authentication)
            .environmentObject(sync)
    }
}

#Preview("Status flip — Articles") {
    DomainListPreview(domain: .articles)
}

#Preview("Status flip — Books") {
    DomainListPreview(domain: .books)
}

#Preview("Status flip — Empty") {
    DomainListPreview(domain: .notes, empty: true)
}

#Preview("Status flip — Reduce Motion") {
    DomainListPreview(domain: .articles, reduceMotion: true)
}
#endif
