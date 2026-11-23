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
        case .articles: !title.isEmpty && URL(string: url)?.scheme.map { ["https", "http"].contains($0) } == true && ArticleCategoryName.isValid(category)
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
                    ArticleCategoryField(name: $category, categories: categories)
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
            }
            .scrollContentBackground(.hidden)
            .background(AppColors.background)
            .foregroundStyle(AppColors.foreground)
            .navigationTitle(domain.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(String(localized: "キャンセル")) { dismiss() }
                        .disabled(saving)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        save()
                    } label: {
                        BusyLabel(isBusy: saving) { Text(String(localized: "保存")) }
                    }
                    .accessibilityLabel(saving ? String(localized: "保存") + ", " + String(localized: "処理中") : String(localized: "保存"))
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
                BusyLabel(isBusy: selectingPhoto, status: String(localized: "写真を読み込み中")) {
                    Label(String(localized: "写真から選択"), systemImage: "photo.on.rectangle")
                }
            }
            .foregroundStyle(AppColors.primary)
            .accessibilityValue(selectingPhoto ? String(localized: "写真を読み込み中") : "")
            .disabled(saving || selectingPhoto)
            Button(String(localized: "ファイルから選択"), systemImage: "folder") { importingFile = true }
                .foregroundStyle(AppColors.primary)
                .disabled(saving || selectingPhoto)
            if let imageData, let image = UIImage(data: imageData) {
                MediaFrame { Image(uiImage: image).resizable().scaledToFit() }
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
                category: domain == .articles ? ArticleCategoryName.normalized(category) : nil,
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
    @FocusState private var searchFocused: Bool
    var galleryLoadMedia: (@MainActor (String) async throws -> Data)?
    var galleryDeleteRecord: (@MainActor (String) async throws -> Void)?
    @EnvironmentObject private var sync: SyncCoordinator
    @EnvironmentObject private var localIntelligence: LocalIntelligenceCoordinator
    @Environment(\.dismiss) private var dismiss
    @State private var gallery: ImageGallerySelection?
    @State private var query: String
    @State private var results: [MobileSearchResult] = []
    @State private var errorMessage: String?
    @State private var aiAnswer = ""
    @State private var isAnswering = false
    @State private var answerTask: Task<Void, Never>?

    init(
        initialQuery: String = "",
        galleryLoadMedia: (@MainActor (String) async throws -> Data)? = nil,
        galleryDeleteRecord: (@MainActor (String) async throws -> Void)? = nil
    ) {
        self.galleryLoadMedia = galleryLoadMedia
        self.galleryDeleteRecord = galleryDeleteRecord
        _query = State(initialValue: initialQuery)
    }

    var body: some View {
        NavigationStack {
            List {
                if let errorMessage { Text(errorMessage).foregroundStyle(AppColors.destructive) }
                if !aiAnswer.isEmpty || isAnswering {
                    Section(String(localized: "Apple Intelligenceの回答")) {
                        Text(aiAnswer)
                            .textSelection(.enabled)
                            .appContentRow()
                        if isAnswering { ProgressView().appContentRow() }
                    }
                }
                ForEach(results, id: \.pageID) { result in
                    if result.type == .images {
                        Button {
                            gallery = ImageGallerySelection(ids: [result.id], selectedID: result.id)
                        } label: { resultLabel(result) }
                        .accessibilityIdentifier("search-result-\(result.type.rawValue)-\(result.id)")
                        .appContentRow()
                    } else if result.type == .articles {
                        ArticleLinkRow(id: result.id, onDeleted: {
                            results.removeAll { $0.pageID == result.pageID }
                        }) {
                            resultLabel(result)
                        }
                        .accessibilityIdentifier("search-result-articles-\(result.id)")
                        .appContentRow()
                    } else {
                        NavigationLink {
                            RecordDetailPagerView(
                                pages: results.filter { $0.type != .articles }.map(\.pageID),
                                selection: result.pageID,
                                onDeleted: { Task { await search() } }
                            )
                        } label: { resultLabel(result) }
                        .accessibilityIdentifier("search-result-\(result.type.rawValue)-\(result.id)")
                        .appContentRow()
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(AppColors.background)
            .foregroundStyle(AppColors.foreground)
            .listStyle(.plain)
            .navigationTitle(String(localized: "検索"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(String(localized: "閉じる")) { dismiss() }
                        .accessibilityIdentifier("search-close-button")
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        answer()
                    } label: {
                        Label(String(localized: "AIで回答"), systemImage: "sparkles")
                    }
                    .disabled(
                        query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ||
                        !localIntelligence.canAnswerWithAppleIntelligence || isAnswering
                    )
                }
            }
            .fullScreenCover(item: $gallery, onDismiss: { Task { await search() } }) { selection in
                ImageGalleryView(selection: selection, loadMedia: galleryLoadMedia, deleteRecord: galleryDeleteRecord)
            }
            .searchable(text: $query)
            .searchFocused($searchFocused)
            .minimizeNavigationWhenScrolling(!searchFocused && !results.isEmpty)
            .onSubmit(of: .search) { Task { await search() } }
            .task(id: query) {
                do {
                    try await Task.sleep(for: .milliseconds(300))
                    await search()
                } catch {}
            }
            .onDisappear { answerTask?.cancel() }
            .overlay {
                if results.isEmpty && errorMessage == nil && aiAnswer.isEmpty && !isAnswering {
                    if query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        AppEmptyState(title: String(localized: "コンテンツを検索"), symbol: "magnifyingglass",
                                      message: String(localized: "タイトルや本文のキーワードを入力してください。"))
                    } else {
                        ContentUnavailableView.search(text: query)
                    }
                }
            }
        }
    }

    private func resultLabel(_ result: MobileSearchResult) -> some View {
        Label {
            VStack(alignment: .leading, spacing: AppLayout.small) {
                Text(result.title).font(.headline)
                Text(result.snippet).font(.caption).foregroundStyle(AppColors.mutedForeground).lineLimit(2)
            }
        } icon: { Image(systemName: result.type.symbol) }
    }

    @MainActor
    private func search() async {
        let submitted = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !submitted.isEmpty else { results = []; return }
        if localIntelligence.isEnabled {
            do {
                results = try await localIntelligence.search(submitted)
                errorMessage = nil
                return
            } catch is CancellationError {
                return
            } catch {
                errorMessage = String(localized: "Spotlight検索を利用できないため、文字列検索に切り替えました")
            }
        } else {
            errorMessage = nil
        }
        results = sync.localSearch(submitted)
    }

    private func answer() {
        let submitted = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !submitted.isEmpty else { return }
        answerTask?.cancel()
        aiAnswer = ""
        isAnswering = true
        answerTask = Task { @MainActor in
            defer { isAnswering = false }
            do {
                let stream = try localIntelligence.answerStream(question: submitted)
                for try await partial in stream {
                    guard !Task.isCancelled else { return }
                    aiAnswer = partial
                }
            } catch is CancellationError {
                return
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}

extension MobileSearchResult {
    var pageID: RecordPageID { RecordPageID(domain: type, id: id) }
}
