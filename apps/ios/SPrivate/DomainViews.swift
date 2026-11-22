import SwiftUI

struct DomainListView: View {
    let domain: MobileDomain
    var reduceMotionOverride: Bool?
    var galleryLoadMedia: (@MainActor (String) async throws -> Data)?
    var galleryDeleteRecord: (@MainActor (String) async throws -> Void)?
    @EnvironmentObject private var authentication: AuthenticationModel
    @EnvironmentObject private var sync: SyncCoordinator
    @EnvironmentObject private var navigation: AppNavigationModel
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var records: [MobileRecord] = []
    @State private var navigationPath: [String] = []
    @State private var hasMore = false
    @State private var status: MobileContentStatus = .exported
    @State private var errorMessage: String?
    @State private var gallery: ImageGallerySelection?
    @State private var showingCreate = false
    @State private var showingSearch = false
    @State private var initialSearchQuery = ""
    @State private var searchPresentationID = UUID()
    @State private var isPullRefreshing = false
    @State private var flipAngle = 0.0
    @State private var flipID: UUID?

    private var isGrid: Bool { domain == .images || domain == .books }
    private var isInitialLoading: Bool {
        records.isEmpty && errorMessage == nil && sync.isSynchronizing && !isPullRefreshing
    }

    var body: some View {
        NavigationStack(path: $navigationPath) {
            ZStack {
                if isGrid {
                    ScrollView {
                        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 3), count: domain == .images ? 3 : 2), spacing: domain == .images ? 3 : 16) {
                            if isInitialLoading {
                                ForEach(0..<6) { _ in
                                    LoadingContent {
                                        VStack(alignment: .leading, spacing: 6) {
                                            SkeletonBlock(cornerRadius: 0).aspectRatio(1, contentMode: .fit)
                                            if domain == .books {
                                                Text(" ").font(.caption).lineLimit(2, reservesSpace: true)
                                                    .frame(maxWidth: .infinity, alignment: .leading)
                                                    .overlay { SkeletonBlock() }
                                            }
                                        }
                                    }
                                }
                            }
                            ForEach(records) { record in
                                if domain == .images {
                                    Button {
                                        gallery = sync.imageGallerySelection(status: status, selectedID: record.id)
                                    } label: {
                                        MediaGridCell(domain: domain, record: record)
                                    }
                                    .buttonStyle(.plain)
                                } else {
                                    NavigationLink(value: record.id) {
                                        MediaGridCell(domain: domain, record: record)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                        .padding(.horizontal, domain == .images ? 3 : 12)
                        gridFooter
                    }
                    .background(AppColors.background)
                    .foregroundStyle(AppColors.foreground)
                    .accessibilityIdentifier("domain-grid-\(domain.rawValue)")
                    .overlay { emptyOrLoadingOverlay }
                } else {
                    listContent
                        .overlay { emptyOrLoadingOverlay }
                }
            }
            .id(status)
            .compositingGroup()
            .rotation3DEffect(.degrees(flipAngle), axis: (x: 0, y: 1, z: 0), perspective: 0.2)
            .clipped()
            .background(AppColors.background)
            .allowsHitTesting(flipID == nil)
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .navigationDestination(for: String.self) { id in
                RecordDetailPagerView(
                    pages: records.map { RecordPageID(domain: domain, id: $0.id) },
                    selection: RecordPageID(domain: domain, id: id),
                    includesPage: { sync.cachedRecord(domain: $0.domain, id: $0.id)?.status == status },
                    loadMore: { last in
                        let page = sync.cachedPage(domain: domain, status: status, after: last.id)
                        let known = Set(records.map(\.id))
                        records.append(contentsOf: page.records.filter { !known.contains($0.id) })
                        hasMore = page.hasMore
                        return (page.records.map { RecordPageID(domain: domain, id: $0.id) }, page.hasMore)
                    },
                    onDeleted: { loadLocal() }
                )
            }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(action: toggleStatus) {
                        Image(systemName: status == .exported ? "eye" : "eye.slash")
                    }
                    .accessibilityLabel(status.localizedTitle)
                    .accessibilityHint(status == .exported ? String(localized: "未公開に切り替え") : String(localized: "公開済みに切り替え"))
                    .accessibilityIdentifier("status-filter")
                    .disabled(flipID != nil)
                }
                ToolbarItemGroup(placement: .topBarTrailing) {
                    Button(String(localized: "登録"), systemImage: "plus") { showingCreate = true }
                        .accessibilityIdentifier("create-button")
                    Button(String(localized: "検索"), systemImage: "magnifyingglass") { showingSearch = true }
                        .accessibilityIdentifier("search-button")
                    NavigationLink {
                        SettingsView()
                    } label: {
                        Label(String(localized: "設定"), systemImage: "gearshape")
                    }
                    .accessibilityIdentifier("settings-link")
                }
            }
            .fullScreenCover(item: $gallery, onDismiss: { loadLocal() }) { selection in
                ImageGalleryView(selection: selection, loadMedia: galleryLoadMedia, deleteRecord: galleryDeleteRecord)
            }
            .sheet(isPresented: $showingSearch) {
                SearchView(
                    initialQuery: initialSearchQuery,
                    galleryLoadMedia: galleryLoadMedia,
                    galleryDeleteRecord: galleryDeleteRecord
                )
                .id(searchPresentationID)
            }
            .sheet(isPresented: $showingCreate, onDismiss: { loadLocal() }) {
                CreateView(domain: domain)
                    .environmentObject(authentication)
            }
            .refreshable {
                isPullRefreshing = true
                defer { isPullRefreshing = false }
                await sync.synchronize(force: true)
                loadLocal()
            }
            .onChange(of: sync.dataRevision) { _, _ in loadLocal() }
            .onChange(of: sync.syncError) { _, _ in loadLocal() }
            .onChange(of: navigation.searchRequest) { _, request in
                handleSearchRequest(request)
            }
            .onChange(of: navigation.recordRequest) { _, request in
                handleRecordRequest(request)
            }
        }
        .onAppear {
            loadLocal()
            handleSearchRequest(navigation.searchRequest)
            handleRecordRequest(navigation.recordRequest)
        }
        .onDisappear { cancelFlip() }
    }

    private func handleSearchRequest(_ request: SearchNavigationRequest?) {
        guard let request, request.domain == domain else { return }
        initialSearchQuery = request.query
        searchPresentationID = request.id
        showingSearch = true
        navigation.consumeSearchRequest(id: request.id)
    }

    private func handleRecordRequest(_ request: RecordNavigationRequest?) {
        guard let request, request.domain == domain else { return }
        navigationPath = [request.recordID]
        navigation.consumeRecordRequest(id: request.id)
    }

    private func toggleStatus() {
        guard flipID == nil else { return }
        let nextStatus: MobileContentStatus = status == .exported ? .unexported : .exported
        let revision = sync.dataRevision
        let preparedPage = sync.cachedPage(domain: domain, status: nextStatus, offset: 0)
        let applyStatus = {
            let page = revision == sync.dataRevision ? preparedPage : sync.cachedPage(domain: domain, status: nextStatus, offset: 0)
            status = nextStatus
            records = page.records
            hasMore = page.hasMore
            errorMessage = sync.syncError
        }
        guard !(reduceMotionOverride ?? reduceMotion) else {
            applyStatus()
            return
        }
        let id = UUID()
        flipID = id
        withAnimation(.easeIn(duration: 0.2)) {
            flipAngle = 90
        } completion: {
            guard flipID == id else { return }
            var transaction = Transaction(animation: nil)
            transaction.disablesAnimations = true
            withTransaction(transaction) {
                applyStatus()
                flipAngle = -90
            }
            // Render the replacement edge-on before animating its front into view.
            DispatchQueue.main.async {
                guard flipID == id else { return }
                withAnimation(.easeOut(duration: 0.2)) {
                    flipAngle = 0
                } completion: {
                    guard flipID == id else { return }
                    flipID = nil
                }
            }
        }
    }

    private func cancelFlip() {
        flipID = nil
        var transaction = Transaction(animation: nil)
        transaction.disablesAnimations = true
        withTransaction(transaction) { flipAngle = 0 }
    }

    private var listContent: some View {
        List {
            if isInitialLoading {
                ForEach(0..<8) { _ in
                    LoadingContent {
                        HStack(spacing: AppLayout.inset) {
                            SkeletonBlock().frame(width: 28, height: 28)
                            SkeletonText()
                        }
                    }
                    .appContentRow()
                }
            }
            if let errorMessage {
                Text(errorMessage).foregroundStyle(AppColors.destructive)
                    .accessibilityIdentifier("domain-error")
                    .appContentRow()
            }
            ForEach(records) { record in
                NavigationLink(value: record.id) {
                    HStack(spacing: AppLayout.inset) {
                        Image(systemName: domain.symbol)
                            .font(.system(size: 22))
                            .frame(width: 28)
                            .foregroundStyle(AppColors.primary)
                            .accessibilityHidden(true)
                        VStack(alignment: .leading, spacing: AppLayout.small) {
                            Text(record.displayTitle).font(.headline).lineLimit(2)
                            Text(record.status.localizedTitle).font(.caption).foregroundStyle(AppColors.mutedForeground)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
                .accessibilityIdentifier("domain-record-\(record.id)")
                .appContentRow()
            }
            if hasMore {
                Button(String(localized: "さらに読み込む")) { loadNextPage() }
                    .foregroundStyle(AppColors.primary)
                    .appContentRow()
            }
        }
        .listStyle(.plain)
        .contentMargins(.horizontal, 0, for: .scrollContent)
        .scrollContentBackground(.hidden)
        .background(AppColors.background)
        .foregroundStyle(AppColors.foreground)
        .accessibilityIdentifier("domain-list-\(domain.rawValue)")
    }

    private var gridFooter: some View {
        VStack {
            if hasMore {
                Button(String(localized: "さらに読み込む")) { loadNextPage() }
                    .foregroundStyle(AppColors.primary)
                    .padding()
            }
            if let errorMessage { Text(errorMessage).foregroundStyle(AppColors.destructive).accessibilityIdentifier("domain-error") }

        }
        .frame(maxWidth: .infinity)
    }

    @ViewBuilder
    private var emptyOrLoadingOverlay: some View {
        if records.isEmpty && errorMessage == nil && !isPullRefreshing && !isInitialLoading {
            AppEmptyState(title: String(localized: "項目がありません"), symbol: domain.symbol,
                          message: String(localized: "新しい項目を登録すると、ここに表示されます。"),
                          actionTitle: String(localized: "登録"), action: { showingCreate = true })
                .accessibilityIdentifier("domain-empty-\(domain.rawValue)")
        }
    }

    private func loadLocal() {
        let count = max(records.count, 30)
        let page = sync.cachedPage(domain: domain, status: status, offset: 0, limit: count)
        records = page.records
        hasMore = page.hasMore
        errorMessage = sync.syncError
    }

    private func loadNextPage() {
        let page = sync.cachedPage(domain: domain, status: status, offset: records.count, limit: 30)
        records.append(contentsOf: page.records)
        hasMore = page.hasMore
    }

}

private struct MediaGridCell: View {
    let domain: MobileDomain
    let record: MobileRecord

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            GeometryReader { geometry in
                MediaThumbnailView(domain: domain, id: record.id, hasImage: domain == .images || record.imagePath != nil, pixelSize: domain == .images ? 400 : 600)
                    .frame(width: geometry.size.width, height: geometry.size.height)
            }
            .aspectRatio(1, contentMode: .fit)
            .clipped()
            if domain == .books {
                Text(record.displayTitle).font(.caption).lineLimit(2, reservesSpace: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(record.displayTitle)
        .accessibilityIdentifier("media-cell-\(record.id)")
    }
}

struct MediaThumbnailView: View {
    let domain: MobileDomain
    let id: String
    var hasImage = true
    var pixelSize = 160
    @EnvironmentObject private var authentication: AuthenticationModel
    @EnvironmentObject private var sync: SyncCoordinator
    @State private var image: UIImage?
    @State private var loading = true

    var body: some View {
        Group {
            if let image {
                Image(uiImage: image).resizable().scaledToFill()
            } else if hasImage && loading {
                SkeletonBlock(cornerRadius: 0)
            } else {
                ImagePlaceholder()
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(AppColors.muted)
        .clipped()
        .accessibilityHidden(true)
        .onChange(of: id) { _, _ in image = nil; loading = true }
        .task(id: "\(id):\(hasImage):\(sync.dataRevision)") {
            guard hasImage else { image = nil; loading = false; return }
            let requestKey = "\(id):\(hasImage):\(sync.dataRevision)"
            loading = true
            defer {
                if requestKey == "\(id):\(hasImage):\(sync.dataRevision)" { loading = false }
            }
            let owner = authentication.ownerKey
            if let cached = await ThumbnailStore.shared.image(owner: owner, domain: domain, id: id, pixelSize: pixelSize) {
                guard !Task.isCancelled else { return }
                image = cached
                return
            }
            do {
                let data = try await MobileClient(authentication: authentication).media(domain, id: id, variant: "thumbnail")
                guard !Task.isCancelled else { return }
                image = await ThumbnailStore.shared.saveAndDecode(data, owner: owner, domain: domain, id: id, pixelSize: pixelSize)
            } catch {
                // Cancellation is not a failed image; a later task can try again.
                guard !Task.isCancelled else { return }
            }
        }
    }
}

extension MobileContentStatus: CaseIterable {
    static var allCases: [MobileContentStatus] { [.unexported, .lastUpdated, .exported] }
    var localizedTitle: String {
        switch self {
        case .unexported: String(localized: "未公開")
        case .lastUpdated: String(localized: "更新済み")
        case .exported: String(localized: "公開済み")
        }
    }
}

struct RecordDetailView: View {
    let domain: MobileDomain
    let id: String
    var deleteRecord: (@MainActor () async throws -> Void)?
    var onDeleted: () -> Void = {}

    var body: some View {
        RecordDetailPagerView(
            pages: [RecordPageID(domain: domain, id: id)],
            selection: RecordPageID(domain: domain, id: id),
            deleteRecord: deleteRecord, onDeleted: onDeleted, standalone: true
        )
    }
}

struct RecordDetailContentView: View {
    let domain: MobileDomain
    let id: String
    var actionError: String?
    @EnvironmentObject private var sync: SyncCoordinator

    var body: some View {
        let record = sync.cachedRecord(domain: domain, id: id)
        let errorMessage = actionError ?? (record == nil && !sync.isSynchronizing ? String(localized: "保存データがありません") : nil)
        ScrollView {
            if domain == .images {
                if let errorMessage {
                    Text(errorMessage).foregroundStyle(AppColors.destructive).padding()
                } else if record != nil {
                    AuthenticatedImageView(domain: .images, id: id)
                        .frame(maxWidth: .infinity)
                } else if sync.isSynchronizing {
                    DetailSkeleton(domain: domain)
                }
            } else {
                VStack(alignment: .leading, spacing: AppLayout.inset) {
                    if record == nil && errorMessage == nil { DetailSkeleton(domain: domain) }
                    if let errorMessage { Text(errorMessage).foregroundStyle(AppColors.destructive) }
                    if let record {
                        Text(record.displayTitle).font(.title2.bold())
                        if domain != .books {
                            Text(record.status.localizedTitle).foregroundStyle(AppColors.mutedForeground)
                        }
                        switch domain {
                        case .articles:
                            if let categoryName = record.categoryName { Text(categoryName) }
                            if let quote = record.quote, !quote.isEmpty { Text(quote) }
                            if let urlString = record.url, let url = URL(string: urlString) {
                                Link(String(localized: "Safariで開く"), destination: url)
                            }
                        case .notes:
                            NativeMarkdownView(source: record.markdown ?? "")
                        case .images:
                            EmptyView()
                        case .books:
                            if record.imagePath != nil {
                                AuthenticatedImageView(domain: .books, id: id)
                            }
                            if let isbn = record.isbn { LabeledContent("ISBN", value: isbn) }
                            if let rating = record.rating { LabeledContent(String(localized: "評価"), value: String(rating)) }
                            if let tags = record.tags { Text(tags.joined(separator: ", ")) }
                            NativeMarkdownView(source: record.markdown ?? "")
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
            }
        }
        .accessibilityIdentifier("record-detail-\(domain.rawValue)")
        .background(AppColors.background)
        .foregroundStyle(AppColors.foreground)
    }
}

struct AuthenticatedImageView: View {
    let domain: MobileDomain
    let id: String
    var loadMedia: (@MainActor () async throws -> Data)?
    @EnvironmentObject private var authentication: AuthenticationModel
    @EnvironmentObject private var sync: SyncCoordinator
    @State private var image: UIImage?
    @State private var errorMessage: String?
    @State private var enlarged = false
    @State private var retryID = 0
    @State private var loading = true

    var body: some View {
        MediaFrame(aspectRatio: domain == .books ? 1 : 4.0 / 3.0) {
            if let image {
                Button { enlarged = true } label: {
                    Image(uiImage: image).resizable().scaledToFit()
                        .accessibilityLabel(String(localized: "画像"))
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("media-open")
                .sheet(isPresented: $enlarged) {
                    ImagePreviewView(image: image)
                }
            } else if let errorMessage {
                VStack(spacing: 12) {
                    Text(errorMessage).foregroundStyle(AppColors.destructive)
                    Button(String(localized: "再試行")) { retryID += 1 }.appTapTarget().buttonStyle(.bordered)
                }
            } else if loading {
                LoadingContent { SkeletonBlock() }
                    .accessibilityIdentifier("media-loading")
            } else {
                Button(String(localized: "再試行")) { retryID += 1 }.appTapTarget().buttonStyle(.bordered)
            }
        }
        .accessibilityIdentifier("media-frame")
        .onChange(of: id) { _, _ in image = nil; errorMessage = nil; loading = true }
        .task(id: "\(id):\(sync.dataRevision):\(retryID)") {
            let requestKey = "\(id):\(sync.dataRevision):\(retryID)"
            errorMessage = nil
            loading = true
            defer {
                if requestKey == "\(id):\(sync.dataRevision):\(retryID)" { loading = false }
            }
            if let data = sync.cachedMedia(domain: domain, id: id, variant: "original"), let cached = UIImage(data: data) {
                image = cached
                return
            }
            do {
                let data: Data
                if let loadMedia {
                    data = try await loadMedia()
                } else {
                    data = try await MobileClient(authentication: authentication).media(domain, id: id, variant: "original")
                }
                guard !Task.isCancelled else { return }
                try? sync.cacheMedia(data, domain: domain, id: id, variant: "original")
                image = UIImage(data: data)
                if image == nil { errorMessage = MobileClientError.invalidResponse.localizedDescription }
            } catch {
                guard !Task.isCancelled else { return }
                if let data = sync.cachedMedia(domain: domain, id: id, variant: "original"), let cached = UIImage(data: data) {
                    image = cached
                } else {
                    errorMessage = MobileOperationError.message(error, taskIsCancelled: Task.isCancelled)
                }
            }
        }
    }
}
