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
    @State private var selectingPhoto = false
    @State private var photoLoadTask: Task<Void, Never>?
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
                if domain != .images {
                    TextField(String(localized: "タイトル"), text: $title)
                        .accessibilityIdentifier("create-title-field")
                }
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
                        .foregroundStyle(AppColors.primary)
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
                if let errorMessage { Text(errorMessage).foregroundStyle(AppColors.destructive) }
                Text(String(localized: "端末に保存してから同期します。通信が切れても同じ操作として再送されます。"))
                    .font(.footnote).foregroundStyle(AppColors.mutedForeground)
            }
            .scrollContentBackground(.hidden)
            .background(AppColors.background)
            .foregroundStyle(AppColors.foreground)
            .navigationTitle(domain.title)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(String(localized: "キャンセル")) { dismiss() }
                        .disabled(saving)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        save()
                    } label: {
                        if saving { ProgressView() } else { Text(String(localized: "保存")) }
                    }
                    .disabled(!canSave || saving || selectingPhoto)
                    .accessibilityIdentifier("save-button")
                }
            }
            .task {
                if domain == .articles {
                    categories = sync.cachedCategories()
                }
            }
            .onChange(of: photoSelection) { _, value in
                photoLoadTask?.cancel()
                selectingPhoto = value != nil
                photoLoadTask = Task {
                    defer { if !Task.isCancelled { selectingPhoto = false } }
                    do {
                        guard let data = try await value?.loadTransferable(type: Data.self) else { return }
                        let normalized = try normalizedJPEG(data)
                        guard !Task.isCancelled else { return }
                        imageData = normalized
                        errorMessage = nil
                    } catch { errorMessage = MobileOperationError.message(error, taskIsCancelled: Task.isCancelled) }
                }
            }
            .fileImporter(isPresented: $importingFile, allowedContentTypes: [.image]) { result in
                do {
                    let url = try result.get()
                    let scoped = url.startAccessingSecurityScopedResource()
                    defer { if scoped { url.stopAccessingSecurityScopedResource() } }
                    imageData = try normalizedJPEG(Data(contentsOf: url))
                    errorMessage = nil
                } catch { errorMessage = MobileOperationError.message(error) }
            }
        }
    }

    private var imagePicker: some View {
        Section(String(localized: "画像")) {
            PhotosPicker(selection: $photoSelection, matching: .images) {
                Label(String(localized: "写真から選択"), systemImage: "photo.on.rectangle")
            }
            .foregroundStyle(AppColors.primary)
            .disabled(saving || selectingPhoto)
            Button(String(localized: "ファイルから選択"), systemImage: "folder") { importingFile = true }
                .foregroundStyle(AppColors.primary)
                .disabled(saving || selectingPhoto)
            if selectingPhoto { ProgressView(String(localized: "写真を読み込み中")) }
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

    private func save() {
        guard canSave && !saving && !selectingPhoto else { return }
        saving = true
        Task { await enqueueAndDismiss() }
    }

    private func enqueueAndDismiss() async {
        defer { saving = false }
        await Task.yield()
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
            dismiss()
            Task { await sync.synchronize(force: true) }
        } catch {
            errorMessage = MobileOperationError.message(error)
        }
    }
}

struct SearchView: View {
    @EnvironmentObject private var sync: SyncCoordinator
    @Environment(\.dismiss) private var dismiss
    @State private var query = ""
    @State private var results: [MobileSearchResult] = []
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            List {
                if let errorMessage { Text(errorMessage).foregroundStyle(AppColors.destructive) }
                ForEach(results) { result in
                    NavigationLink {
                        RecordDetailView(domain: result.type, id: result.id)
                    } label: {
                        Label {
                            VStack(alignment: .leading) {
                                Text(result.title)
                                Text(result.snippet).font(.caption).foregroundStyle(AppColors.mutedForeground).lineLimit(2)
                            }
                        } icon: { Image(systemName: result.type.symbol) }
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(AppColors.background)
            .foregroundStyle(AppColors.foreground)
            .navigationTitle(String(localized: "検索"))
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(String(localized: "閉じる")) { dismiss() }
                        .accessibilityIdentifier("search-close-button")
                }
            }
            .searchable(text: $query)
            .onSubmit(of: .search) { search() }
            .overlay {
                if results.isEmpty && errorMessage == nil {
                    ContentUnavailableView.search(text: query)
                }
            }
        }
    }

    private func search() {
        let submitted = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !submitted.isEmpty else { results = []; return }
        results = sync.localSearch(submitted)
        errorMessage = nil
    }
}
