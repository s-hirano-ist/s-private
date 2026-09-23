import PhotosUI
import SwiftUI
import UniformTypeIdentifiers

struct CreateView: View {
    let domain: MobileDomain
    @EnvironmentObject private var authentication: AuthenticationModel
    @EnvironmentObject private var sync: SyncCoordinator
    @Environment(\.dismiss) private var dismiss
    @State private var title = ""
    @State private var url = ""
    @State private var quote = ""
    @State private var markdown = ""
    @State private var category = ""
    @State private var categories: [MobileCategory] = []
    @State private var isbn = ""
    @State private var rating = 1
    @State private var tags = ""
    @State private var imageData: Data?
    @State private var photoSelection: PhotosPickerItem?
    @State private var importingFile = false
    @State private var saving = false
    @State private var errorMessage: String?

    private var canSave: Bool {
        switch domain {
        case .articles: !title.isEmpty && URL(string: url)?.scheme.map { ["https", "http"].contains($0) } == true && !category.isEmpty
        case .notes: !title.isEmpty
        case .images: imageData != nil
        case .books: !title.isEmpty && !isbn.isEmpty && imageData != nil
        }
    }

    var body: some View {
        NavigationStack {
            Form {
                if domain != .images { TextField(String(localized: "タイトル"), text: $title) }
                switch domain {
                case .articles:
                    TextField("URL", text: $url).textInputAutocapitalization(.never).keyboardType(.URL)
                    TextField(String(localized: "カテゴリ"), text: $category)
                    if !categories.isEmpty {
                        Menu(String(localized: "既存カテゴリから選択")) {
                            ForEach(categories) { value in
                                Button(value.name) { category = value.name }
                            }
                        }
                    }
                    TextField(String(localized: "引用"), text: $quote, axis: .vertical)
                case .notes:
                    TextField("Markdown", text: $markdown, axis: .vertical).lineLimit(6...20)
                case .images:
                    imagePicker
                case .books:
                    TextField("ISBN", text: $isbn).keyboardType(.numbersAndPunctuation)
                    Picker(String(localized: "評価"), selection: $rating) {
                        ForEach(1...5, id: \.self) { value in Text(String(value)).tag(value) }
                    }
                    TextField(String(localized: "タグ（カンマ区切り）"), text: $tags)
                    imagePicker
                }
                if let errorMessage { Text(errorMessage).foregroundStyle(.red) }
                Text(String(localized: "端末に保存してから同期します。通信が切れても同じ操作として再送されます。"))
                    .font(.footnote).foregroundStyle(.secondary)
            }
            .navigationTitle(domain.title)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(String(localized: "キャンセル")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(String(localized: "保存")) { Task { await save() } }
                        .disabled(!canSave || saving)
                }
            }
            .task {
                if domain == .articles {
                    do { categories = try await MobileClient(authentication: authentication).categories() }
                    catch { errorMessage = error.localizedDescription }
                }
            }
            .onChange(of: photoSelection) { _, value in
                Task {
                    do {
                        guard let data = try await value?.loadTransferable(type: Data.self) else { return }
                        imageData = try normalizedJPEG(data)
                        errorMessage = nil
                    } catch { errorMessage = error.localizedDescription }
                }
            }
            .fileImporter(isPresented: $importingFile, allowedContentTypes: [.image]) { result in
                do {
                    let url = try result.get()
                    let scoped = url.startAccessingSecurityScopedResource()
                    defer { if scoped { url.stopAccessingSecurityScopedResource() } }
                    imageData = try normalizedJPEG(Data(contentsOf: url))
                    errorMessage = nil
                } catch { errorMessage = error.localizedDescription }
            }
        }
    }

    private var imagePicker: some View {
        Section(String(localized: "画像")) {
            PhotosPicker(selection: $photoSelection, matching: .images) {
                Label(String(localized: "写真から選択"), systemImage: "photo.on.rectangle")
            }
            Button(String(localized: "ファイルから選択"), systemImage: "folder") { importingFile = true }
            if let imageData, let image = UIImage(data: imageData) {
                Image(uiImage: image).resizable().scaledToFit().frame(maxHeight: 220)
                Text(ByteCountFormatter.string(fromByteCount: Int64(imageData.count), countStyle: .file))
            }
        }
    }

    private func normalizedJPEG(_ data: Data) throws -> Data {
        guard let source = UIImage(data: data) else { throw MobileClientError.invalidResponse }
        let image = UIGraphicsImageRenderer(size: source.size).image { _ in
            source.draw(in: CGRect(origin: .zero, size: source.size))
        }
        guard let jpeg = image.jpegData(compressionQuality: 0.75) else { throw MobileClientError.invalidResponse }
        guard jpeg.count <= MobileClient.imageLimit else { throw MobileClientError.uploadTooLarge }
        return jpeg
    }

    private func save() async {
        saving = true
        defer { saving = false }
        do {
            let operationID = UUID()
            let input = MobileCreate(
                operationId: operationID, title: title,
                url: domain == .articles ? url : nil,
                category: domain == .articles ? category : nil,
                quote: domain == .articles ? quote : nil,
                markdown: domain == .notes ? markdown : nil,
                isbn: domain == .books ? isbn : nil,
                rating: domain == .books ? rating : nil,
                tags: domain == .books ? tags : nil
            )
            switch domain {
            case .articles, .notes:
                try sync.enqueue(domain: domain, input: input)
            case .images, .books:
                guard let imageData else { return }
                try sync.enqueue(domain: domain, input: input, attachment: imageData)
            }
            await sync.synchronize()
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct SearchView: View {
    @EnvironmentObject private var authentication: AuthenticationModel
    @Environment(\.dismiss) private var dismiss
    @State private var query = ""
    @State private var results: [MobileSearchResult] = []
    @State private var errorMessage: String?
    @State private var searching = false

    var body: some View {
        NavigationStack {
            List {
                if let errorMessage { Text(errorMessage).foregroundStyle(.red) }
                if searching { ProgressView() }
                ForEach(results) { result in
                    NavigationLink {
                        RecordDetailView(domain: result.type, id: result.id)
                    } label: {
                        Label {
                            VStack(alignment: .leading) {
                                Text(result.title)
                                Text(result.snippet).font(.caption).foregroundStyle(.secondary).lineLimit(2)
                            }
                        } icon: { Image(systemName: result.type.symbol) }
                    }
                }
            }
            .navigationTitle(String(localized: "検索"))
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(String(localized: "閉じる")) { dismiss() }
                        .accessibilityIdentifier("search-close-button")
                }
                ToolbarItem(placement: .topBarTrailing) {
                    NavigationLink {
                        SettingsView()
                    } label: {
                        Label(String(localized: "設定"), systemImage: "gearshape")
                    }
                    .accessibilityIdentifier("settings-link")
                }
            }
            .searchable(text: $query)
            .onSubmit(of: .search) { Task { await search() } }
            .overlay {
                if results.isEmpty && !searching && errorMessage == nil {
                    ContentUnavailableView.search(text: query)
                }
            }
        }
    }

    private func search() async {
        let submitted = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !submitted.isEmpty else { results = []; return }
        searching = true
        defer { searching = false }
        do {
            results = try await MobileClient(authentication: authentication).search(submitted)
            errorMessage = nil
        } catch { errorMessage = error.localizedDescription }
    }
}
