import SwiftUI
import SwiftData

struct RecordPageID: Hashable {
    let domain: MobileDomain
    let id: String
}

/// Keeps the opening order stable while sync changes the backing cache.
struct RecordPagingState {
    private(set) var pages: [RecordPageID]
    var selection: RecordPageID
    var hasMore: Bool

    init(pages: [RecordPageID], selection: RecordPageID, hasMore: Bool = false) {
        var seen = Set<RecordPageID>()
        self.pages = pages.filter { seen.insert($0).inserted }
        self.selection = selection
        self.hasMore = hasMore
    }

    var shouldLoadMore: Bool {
        guard hasMore, let index = pages.firstIndex(of: selection) else { return false }
        return index >= pages.count - 2
    }

    mutating func append(_ additional: [RecordPageID], hasMore: Bool) {
        var seen = Set(pages)
        pages.append(contentsOf: additional.filter { seen.insert($0).inserted })
        self.hasMore = hasMore
    }

    mutating func retain(_ exists: (RecordPageID) -> Bool) {
        let old = pages
        let index = old.firstIndex(of: selection) ?? 0
        pages = old.filter(exists)
        let survivors = Set(pages)
        if !survivors.contains(selection), !pages.isEmpty {
            selection = old.dropFirst(index + 1).first(where: { survivors.contains($0) }) ?? pages[pages.count - 1]
        }
    }

    var nearbyPages: Set<RecordPageID> {
        guard let index = pages.firstIndex(of: selection) else { return [] }
        return Set(pages[max(0, index - 1)...min(pages.count - 1, index + 1)])
    }
}

struct RecordDetailPagerView: View {
    var includesPage: ((RecordPageID) -> Bool)?
    var loadMore: ((RecordPageID) -> ([RecordPageID], Bool))?
    var deleteRecord: (@MainActor () async throws -> Void)?
    var onDeleted: () -> Void
    private let standalone: Bool
    @EnvironmentObject private var authentication: AuthenticationModel
    @EnvironmentObject private var sync: SyncCoordinator
    @Environment(\.dismiss) private var dismiss
    @State private var paging: RecordPagingState
    @State private var errorMessage: String?
    @State private var showingDelete = false
    @State private var deleting = false
    @State private var deleteTarget: RecordPageID?

    init(pages: [RecordPageID], selection: RecordPageID,
         includesPage: ((RecordPageID) -> Bool)? = nil,
         loadMore: ((RecordPageID) -> ([RecordPageID], Bool))? = nil,
         deleteRecord: (@MainActor () async throws -> Void)? = nil,
         onDeleted: @escaping () -> Void = {}, standalone: Bool = false) {
        _paging = State(initialValue: RecordPagingState(pages: pages, selection: selection, hasMore: loadMore != nil))
        self.includesPage = includesPage
        self.standalone = standalone
        self.loadMore = loadMore
        self.deleteRecord = deleteRecord
        self.onDeleted = onDeleted
    }

    private var domain: MobileDomain { paging.selection.domain }
    private var id: String { paging.selection.id }
    private var record: MobileRecord? { sync.cachedRecord(domain: domain, id: id) }

    private struct ContentRevision: Hashable {
        let data: Int
        let error: String?
    }

    var body: some View {
        RecordPager(pages: paging.pages, selection: $paging.selection,
                    pagingEnabled: !showingDelete && !deleting,
                    contentRevision: ContentRevision(data: sync.dataRevision, error: errorMessage)) { page in
            RecordDetailContentView(domain: page.domain, id: page.id,
                                    actionError: page == paging.selection ? errorMessage : nil)
                .environmentObject(authentication)
                .environmentObject(sync)
        }
        .disabled(showingDelete || deleting)
        .allowsHitTesting(!deleting)
        .accessibilityIdentifier("record-pager")
        .accessibilityValue("\(domain.rawValue):\(id)")
        .navigationBarBackButtonHidden(deleting)
        .navigationTitle(domain == .images ? "" : domain.title)
        .toolbar {
            if record != nil {
                if domain == .images {
                    Menu {
                        Button(String(localized: "削除"), systemImage: "trash", role: .destructive) { requestDelete() }
                    } label: {
                        BusyLabel(isBusy: deleting, status: String(localized: "削除中")) {
                            Image(systemName: "ellipsis.circle")
                                .accessibilityLabel(String(localized: "その他"))
                        }
                    }
                    .accessibilityLabel(deleting ? String(localized: "その他") + ", " + String(localized: "削除中") : String(localized: "その他"))
                    .disabled(deleting)
                    .accessibilityIdentifier("record-delete-menu")
                } else {
                    Button(role: .destructive) { requestDelete() } label: {
                        BusyLabel(isBusy: deleting, status: String(localized: "削除中")) {
                            Label(String(localized: "削除"), systemImage: "trash")
                        }
                    }
                    .labelStyle(.iconOnly)
                    .accessibilityLabel(deleting ? String(localized: "削除") + ", " + String(localized: "削除中") : String(localized: "削除"))
                    .disabled(deleting)
                    .accessibilityIdentifier("record-delete-button")
                }
            }
        }
        .confirmationDialog(String(localized: "この項目を削除しますか？"), isPresented: $showingDelete, titleVisibility: .visible) {
            Button(String(localized: "削除"), role: .destructive) { Task { await delete() } }
                .disabled(deleting)
                .accessibilityIdentifier("record-delete-confirm")
        }
        .task { reconcile(); extendIfNeeded() }
        .onChange(of: paging.selection) { _, _ in
            errorMessage = nil
            extendIfNeeded()
        }
        .onChange(of: showingDelete) { _, shown in
            guard !shown && !deleting else { return }
            reconcile()
            extendIfNeeded()
        }
        .onChange(of: sync.dataRevision) { _, _ in
            guard !deleting && !showingDelete else { return }
            reconcile()
            extendIfNeeded()
        }
    }

    private func reconcile() {
        // Preserve a single missing-record error screen (used by standalone details).
        if standalone { return }
        paging.retain { includesPage?($0) ?? (sync.cachedRecord(domain: $0.domain, id: $0.id) != nil) }
        if paging.pages.isEmpty { dismiss() }
    }

    private func extendIfNeeded() {
        guard paging.shouldLoadMore, let last = paging.pages.last, let loadMore else { return }
        let (pages, hasMore) = loadMore(last)
        paging.append(pages, hasMore: hasMore)
    }

    private func requestDelete() {
        deleteTarget = paging.selection
        showingDelete = true
    }

    private func delete() async {
        guard !deleting, let target = deleteTarget else { return }
        deleting = true
        defer { deleting = false }
        do {
            if let deleteRecord { try await deleteRecord() }
            else { try await MobileClient(authentication: authentication).delete(target.domain, id: target.id) }
            sync.removeCached(domain: target.domain, id: target.id)
            onDeleted()
            dismiss()
        } catch { errorMessage = MobileOperationError.message(error, taskIsCancelled: Task.isCancelled) }
    }
}

#if DEBUG
#Preview("Details across domains") {
    let authentication = AuthenticationModel()
    let container = try! ModelContainer(
        for: CachedMobileRecord.self, CachedMobileCategory.self, PendingMobileOperation.self, MobileSyncState.self,
        configurations: ModelConfiguration(isStoredInMemoryOnly: true)
    )
    let sync = SyncCoordinator(container: container, authentication: authentication)
    let pages = [MobileDomain.articles, .notes].map { RecordPageID(domain: $0, id: "preview") }
    let _ = pages.forEach { page in
        try! sync.cache(domain: page.domain, records: [MobileRecord(
            id: page.id, status: .exported, createdAt: .now, updatedAt: .now,
            exportedAt: nil, title: "Swipe to the next detail", url: nil, quote: nil,
            categoryId: nil, categoryName: nil, markdown: "# A note\nNative Markdown content.",
            isbn: nil, rating: nil, tags: nil, path: nil, imagePath: nil, contentType: nil, fileSize: nil
        )])
    }
    NavigationStack {
        RecordDetailPagerView(pages: pages, selection: pages[0])
    }
    .environmentObject(authentication)
    .environmentObject(sync)
}
#endif
