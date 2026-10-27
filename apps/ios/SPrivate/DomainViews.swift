import SwiftUI

struct DomainListView: View {
    let domain: MobileDomain
    @EnvironmentObject private var authentication: AuthenticationModel
    @EnvironmentObject private var sync: SyncCoordinator
    @State private var records: [MobileRecord] = []
    @State private var hasMore = false
    @State private var status: MobileContentStatus = .unexported
    @State private var errorMessage: String?
    @State private var showingCreate = false
    @State private var showingSearch = false
    @State private var isPullRefreshing = false

    private var isGrid: Bool { domain == .images || domain == .books }
    private var isInitialLoading: Bool {
        records.isEmpty && errorMessage == nil && sync.isSynchronizing && !isPullRefreshing
    }

    var body: some View {
        NavigationStack {
            Group {
                if isGrid {
                    ScrollView {
                        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 3), count: domain == .images ? 3 : 2), spacing: domain == .images ? 3 : 16) {
                            ForEach(records) { record in
                                NavigationLink(value: record.id) {
                                    MediaGridCell(domain: domain, record: record)
                                }
                                .buttonStyle(.plain)
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
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .navigationDestination(for: String.self) { id in
                RecordDetailView(domain: domain, id: id) { loadLocal() }
            }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Menu {
                        ForEach([MobileContentStatus.unexported, .exported], id: \.self) { value in
                            Button(value.localizedTitle) { status = value }
                        }
                    } label: { Label(status.localizedTitle, systemImage: "line.3.horizontal.decrease") }
                    .accessibilityIdentifier("status-filter")
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
            .sheet(isPresented: $showingSearch) {
                SearchView()
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
            .task(id: status) { loadLocal(reset: true) }
            .onChange(of: sync.dataRevision) { _, _ in loadLocal() }
            .onChange(of: sync.syncError) { _, _ in loadLocal() }
        }
    }

    private var listContent: some View {
        List {
            if let errorMessage {
                Text(errorMessage).foregroundStyle(AppColors.destructive)
                    .accessibilityIdentifier("domain-error")
                    .listRowBackground(AppColors.background)
            }
            ForEach(records) { record in
                NavigationLink(value: record.id) {
                    HStack(spacing: 16) {
                        Image(systemName: domain.symbol)
                            .font(.system(size: 22))
                            .frame(width: 28)
                            .foregroundStyle(AppColors.primary)
                            .accessibilityHidden(true)
                        VStack(alignment: .leading) {
                            Text(record.displayTitle).lineLimit(2)
                            Text(record.status.localizedTitle).font(.caption).foregroundStyle(AppColors.mutedForeground)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
                .accessibilityIdentifier("domain-record-\(record.id)")
                .listRowInsets(.horizontal, 16)
                .listRowBackground(AppColors.background)
                .alignmentGuide(.listRowSeparatorLeading) { $0[.leading] }
                .alignmentGuide(.listRowSeparatorTrailing) { $0[.trailing] }
            }
            if hasMore {
                Button(String(localized: "さらに読み込む")) { loadNextPage() }
                    .foregroundStyle(AppColors.primary)
                    .listRowBackground(AppColors.background)
            }
            if let fetchedAt = sync.lastSyncAt {
                Text(lastFetchedText(fetchedAt))
                    .font(.caption)
                    .foregroundStyle(AppColors.mutedForeground)
                    .listRowBackground(AppColors.background)
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
            if let fetchedAt = sync.lastSyncAt {
                Text(lastFetchedText(fetchedAt))
                    .font(.caption).foregroundStyle(AppColors.mutedForeground).padding()
            }
        }
        .frame(maxWidth: .infinity)
    }

    @ViewBuilder
    private var emptyOrLoadingOverlay: some View {
        if isInitialLoading {
            ProgressView(String(localized: "読み込み中"))
                .accessibilityIdentifier("initial-loading")
        } else if records.isEmpty && errorMessage == nil && !isPullRefreshing {
            ContentUnavailableView(String(localized: "項目がありません"), systemImage: domain.symbol)
                .accessibilityIdentifier("domain-empty-\(domain.rawValue)")
                .allowsHitTesting(false)
        }
    }

    private func loadLocal(reset: Bool = false) {
        let count = reset ? 30 : max(records.count, 30)
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

    private func lastFetchedText(_ date: Date) -> String {
        String(
            format: String(localized: "最終取得: %@"),
            locale: .current,
            date.formatted(date: .abbreviated, time: .shortened)
        )
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

    var body: some View {
        Group {
            if let image {
                Image(uiImage: image).resizable().scaledToFill()
            } else {
                Image(systemName: domain.symbol).resizable().scaledToFit().padding(12)
                    .foregroundStyle(AppColors.mutedForeground)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(AppColors.muted)
        .clipped()
        .accessibilityHidden(true)
        .task(id: sync.dataRevision) {
            guard hasImage else { return }
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
                // Keep the placeholder when a thumbnail cannot be fetched.
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
    var onDeleted: () -> Void = {}
    @EnvironmentObject private var authentication: AuthenticationModel
    @EnvironmentObject private var sync: SyncCoordinator
    @Environment(\.dismiss) private var dismiss
    @State private var record: MobileRecord?
    @State private var errorMessage: String?
    @State private var showingDelete = false
    @State private var deleting = false

    var body: some View {
        ScrollView {
            if domain == .images {
                if let errorMessage {
                    Text(errorMessage).foregroundStyle(AppColors.destructive).padding()
                } else if record != nil {
                    AuthenticatedImageView(domain: .images, id: id)
                        .frame(maxWidth: .infinity)
                } else if sync.isSynchronizing {
                    ProgressView().frame(maxWidth: .infinity).padding()
                }
            } else {
                VStack(alignment: .leading, spacing: 16) {
                    if record == nil && errorMessage == nil { ProgressView() }
                    if let errorMessage { Text(errorMessage).foregroundStyle(AppColors.destructive) }
                    if let record {
                        Text(record.displayTitle).font(.title2.bold())
                        Text(record.status.localizedTitle).foregroundStyle(AppColors.mutedForeground)
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
                            AuthenticatedImageView(domain: .books, id: id)
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
        .navigationTitle(domain == .images ? "" : domain.title)
        .toolbar {
            if deleting {
                ProgressView(String(localized: "削除中"))
            } else if record?.status == .unexported {
                if domain == .images {
                    Menu {
                        Button(String(localized: "削除"), systemImage: "trash", role: .destructive) { showingDelete = true }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                            .accessibilityLabel(String(localized: "その他"))
                    }
                } else {
                    Button(String(localized: "削除"), systemImage: "trash", role: .destructive) { showingDelete = true }
                }
            }
        }
        .confirmationDialog(String(localized: "この項目を削除しますか？"), isPresented: $showingDelete) {
            Button(String(localized: "削除"), role: .destructive) { Task { await delete() } }
                .disabled(deleting)
        }
        .task(id: id) { reload() }
        .onChange(of: sync.dataRevision) { _, _ in reload() }
        .onChange(of: sync.isSynchronizing) { _, _ in reload() }
    }

    private func reload() {
        record = sync.cachedRecord(domain: domain, id: id)
        errorMessage = record == nil && !sync.isSynchronizing ? String(localized: "保存データがありません") : nil
    }

    private func delete() async {
        guard !deleting else { return }
        deleting = true
        defer { deleting = false }
        do {
            try await MobileClient(authentication: authentication).delete(domain, id: id)
            sync.removeCached(domain: domain, id: id)
            onDeleted()
            dismiss()
        } catch { errorMessage = MobileOperationError.message(error, taskIsCancelled: Task.isCancelled) }
    }
}

struct AuthenticatedImageView: View {
    let domain: MobileDomain
    let id: String
    @EnvironmentObject private var authentication: AuthenticationModel
    @EnvironmentObject private var sync: SyncCoordinator
    @State private var image: UIImage?
    @State private var errorMessage: String?
    @State private var enlarged = false
    @State private var retryID = 0
    @State private var loading = true

    var body: some View {
        Group {
            if let image {
                Image(uiImage: image).resizable().scaledToFit()
                    .accessibilityLabel(String(localized: "画像"))
                    .onTapGesture { enlarged = true }
                    .sheet(isPresented: $enlarged) {
                        NavigationStack {
                            ScrollView([.horizontal, .vertical]) {
                                Image(uiImage: image).resizable().scaledToFit()
                            }
                            .toolbar { Button(String(localized: "閉じる")) { enlarged = false } }
                        }
                    }
            } else if let errorMessage {
                VStack(spacing: 12) {
                    Text(errorMessage).foregroundStyle(AppColors.destructive)
                    Button(String(localized: "再試行")) { retryID += 1 }
                }
            } else if loading {
                ProgressView()
            } else {
                Button(String(localized: "再試行")) { retryID += 1 }
            }
        }
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
                let data = try await MobileClient(authentication: authentication).media(domain, id: id, variant: "original")
                guard !Task.isCancelled else { return }
                try? sync.cacheMedia(data, domain: domain, id: id, variant: "original")
                image = UIImage(data: data)
                if image == nil { errorMessage = MobileClientError.invalidResponse.localizedDescription }
            } catch {
                if let data = sync.cachedMedia(domain: domain, id: id, variant: "original"), let cached = UIImage(data: data) {
                    image = cached
                } else {
                    errorMessage = MobileOperationError.message(error, taskIsCancelled: Task.isCancelled)
                }
            }
        }
    }
}
