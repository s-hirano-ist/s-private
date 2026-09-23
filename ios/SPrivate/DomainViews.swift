import SwiftUI

struct DomainListView: View {
    let domain: MobileDomain
    @EnvironmentObject private var authentication: AuthenticationModel
    @EnvironmentObject private var sync: SyncCoordinator
    @State private var records: [MobileRecord] = []
    @State private var status: MobileContentStatus?
    @State private var totalCount = 0
    @State private var loading = false
    @State private var errorMessage: String?
    @State private var showingCreate = false
    @State private var requestID = UUID()

    private var isGrid: Bool { domain == .images || domain == .books }

    var body: some View {
        NavigationStack {
            Group {
                if isGrid {
                    ScrollView {
                        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 3), count: domain == .images ? 3 : 2), spacing: domain == .images ? 3 : 16) {
                            ForEach(Array(records.enumerated()), id: \.element.id) { index, record in
                                NavigationLink(value: record.id) {
                                    MediaGridCell(domain: domain, record: record)
                                }
                                .buttonStyle(.plain)
                                .onAppear { loadNextPageIfNeeded(at: index) }
                            }
                        }
                        .padding(.horizontal, domain == .images ? 3 : 12)
                        gridFooter
                    }
                    .accessibilityIdentifier("domain-grid-\(domain.rawValue)")
                } else {
                    listContent
                }
            }
            .navigationTitle(domain.title)
            .navigationDestination(for: String.self) { id in
                RecordDetailView(domain: domain, id: id) { Task { await load(reset: true) } }
            }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Menu {
                        Button(String(localized: "すべて")) { status = nil }
                        ForEach(MobileContentStatus.allCases, id: \.self) { value in
                            Button(value.localizedTitle) { status = value }
                        }
                    } label: { Label(status?.localizedTitle ?? String(localized: "すべて"), systemImage: "line.3.horizontal.decrease") }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(String(localized: "登録"), systemImage: "plus") { showingCreate = true }
                }
            }
            .sheet(isPresented: $showingCreate, onDismiss: { Task { await load(reset: true) } }) {
                CreateView(domain: domain)
                    .environmentObject(authentication)
            }
            .refreshable { await load(reset: true) }
            .task(id: status) { await load(reset: true) }
        }
    }

    private var listContent: some View {
        List {
                if let errorMessage {
                    Text(errorMessage).foregroundStyle(.red)
                        .accessibilityIdentifier("domain-error")
                }
                if records.isEmpty && !loading && errorMessage == nil {
                    ContentUnavailableView(String(localized: "項目がありません"), systemImage: domain.symbol)
                }
                ForEach(records) { record in
                    NavigationLink(value: record.id) {
                        Label {
                            VStack(alignment: .leading) {
                                Text(record.displayTitle).lineLimit(2)
                                Text(record.status.localizedTitle).font(.caption).foregroundStyle(.secondary)
                            }
                        } icon: {
                            if domain == .images || domain == .books {
                                MediaThumbnailView(domain: domain, id: record.id)
                            } else {
                                Image(systemName: domain.symbol)
                            }
                        }
                    }
                }
                if records.count < totalCount {
                    Button(String(localized: "さらに読み込む")) { Task { await load(reset: false) } }
                        .disabled(loading)
                }
                if loading { ProgressView() }
                if let fetchedAt = sync.lastSyncAt {
                    Text(String(localized: "最終取得: \(fetchedAt.formatted(date: .abbreviated, time: .shortened))"))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
        }
        .accessibilityIdentifier("domain-list-\(domain.rawValue)")
    }

    private var gridFooter: some View {
        VStack {
            if let errorMessage { Text(errorMessage).foregroundStyle(.red).accessibilityIdentifier("domain-error") }
            if errorMessage != nil && !records.isEmpty && records.count < totalCount {
                Button(String(localized: "再読み込み")) { Task { await load(reset: false) } }
            }
            if records.isEmpty && !loading && errorMessage == nil {
                ContentUnavailableView(String(localized: "項目がありません"), systemImage: domain.symbol)
            }
            if loading { ProgressView().padding() }
            if let fetchedAt = sync.lastSyncAt {
                Text(String(localized: "最終取得: \(fetchedAt.formatted(date: .abbreviated, time: .shortened))"))
                    .font(.caption).foregroundStyle(.secondary).padding()
            }
        }
        .frame(maxWidth: .infinity)
    }

    private func loadNextPageIfNeeded(at index: Int) {
        guard !loading, records.count < totalCount, index >= records.count - 6 else { return }
        Task { await load(reset: false) }
    }

    private func load(reset: Bool) async {
        if !reset && loading { return }
        let id = reset ? UUID() : requestID
        if reset {
            requestID = id
            records = []
            totalCount = 0
            errorMessage = nil
        }
        let requestedStatus = status
        loading = true
        defer { if requestID == id { loading = false } }
        do {
            let page = try await MobileClient(authentication: authentication).list(domain, status: requestedStatus, offset: reset ? 0 : records.count)
            guard requestID == id, status == requestedStatus, !Task.isCancelled else { return }
            records = reset ? page.data : records + page.data
            totalCount = page.totalCount
            if reset && requestedStatus == nil { try? sync.cache(domain: domain, records: records) }
            errorMessage = nil
        } catch {
            guard requestID == id, status == requestedStatus, !Task.isCancelled else { return }
            if reset {
                let cached = sync.cached(domain: domain).filter { requestedStatus == nil || $0.status == requestedStatus }
                if !cached.isEmpty { records = cached; totalCount = cached.count; errorMessage = String(localized: "オフラインの保存データを表示しています") }
                else { errorMessage = error.localizedDescription }
            } else { errorMessage = error.localizedDescription }
        }
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
            .aspectRatio(domain == .images ? 1 : 2.0 / 3.0, contentMode: .fit)
            .clipped()
            if domain == .books {
                Text(record.displayTitle).font(.caption).lineLimit(2)
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
    @State private var image: UIImage?

    var body: some View {
        Group {
            if let image {
                Image(uiImage: image).resizable().scaledToFill()
            } else {
                Image(systemName: domain.symbol).resizable().scaledToFit().padding(12)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .clipped()
        .accessibilityHidden(true)
        .task(id: id) {
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
    @Environment(\.dismiss) private var dismiss
    @State private var record: MobileRecord?
    @State private var errorMessage: String?
    @State private var showingDelete = false
    @State private var loading = true

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if loading { ProgressView() }
                if let errorMessage { Text(errorMessage).foregroundStyle(.red) }
                if let record {
                    Text(record.displayTitle).font(.title2.bold())
                    Text(record.status.localizedTitle).foregroundStyle(.secondary)
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
                        AuthenticatedImageView(domain: .images, id: id)
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
        .navigationTitle(domain.title)
        .toolbar {
            if record?.status == .unexported {
                Button(String(localized: "削除"), systemImage: "trash", role: .destructive) { showingDelete = true }
            }
        }
        .confirmationDialog(String(localized: "この項目を削除しますか？"), isPresented: $showingDelete) {
            Button(String(localized: "削除"), role: .destructive) { Task { await delete() } }
        }
        .task(id: id) { await reload() }
    }

    private func reload() async {
        loading = true
        defer { loading = false }
        do {
            record = try await MobileClient(authentication: authentication).detail(domain, id: id)
            errorMessage = nil
        } catch { errorMessage = error.localizedDescription }
    }

    private func delete() async {
        do {
            try await MobileClient(authentication: authentication).delete(domain, id: id)
            onDeleted()
            dismiss()
        } catch { errorMessage = error.localizedDescription }
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
                Text(errorMessage).foregroundStyle(.red)
            } else {
                ProgressView()
            }
        }
        .task(id: id) {
            do {
                let data = try await MobileClient(authentication: authentication).media(domain, id: id, variant: "original")
                try? sync.cacheMedia(data, domain: domain, id: id, variant: "original")
                image = UIImage(data: data)
                if image == nil { errorMessage = MobileClientError.invalidResponse.localizedDescription }
            } catch {
                if let data = sync.cachedMedia(domain: domain, id: id, variant: "original") { image = UIImage(data: data) }
                else { errorMessage = error.localizedDescription }
            }
        }
    }
}
