import SwiftUI

struct DomainListView: View {
    let domain: MobileDomain
    @EnvironmentObject private var authentication: AuthenticationModel
    @State private var records: [MobileRecord] = []
    @State private var status: MobileContentStatus?
    @State private var totalCount = 0
    @State private var loading = false
    @State private var errorMessage: String?
    @State private var showingCreate = false

    var body: some View {
        NavigationStack {
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
            }
            .accessibilityIdentifier("domain-list-\(domain.rawValue)")
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

    private func load(reset: Bool) async {
        guard !loading else { return }
        loading = true
        defer { loading = false }
        do {
            let page = try await MobileClient(authentication: authentication).list(domain, status: status, offset: reset ? 0 : records.count)
            records = reset ? page.data : records + page.data
            totalCount = page.totalCount
            errorMessage = nil
        } catch { errorMessage = error.localizedDescription }
    }
}

struct MediaThumbnailView: View {
    let domain: MobileDomain
    let id: String
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
        .frame(width: 56, height: 56)
        .clipped()
        .accessibilityHidden(true)
        .task(id: id) {
            guard let data = try? await MobileClient(authentication: authentication).media(domain, id: id, variant: "thumbnail") else { return }
            image = UIImage(data: data)
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
                image = UIImage(data: data)
                if image == nil { errorMessage = MobileClientError.invalidResponse.localizedDescription }
            } catch { errorMessage = error.localizedDescription }
        }
    }
}
