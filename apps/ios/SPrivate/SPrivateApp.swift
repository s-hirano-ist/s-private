import AppIntents
import SwiftUI
import SwiftData

@main
struct SPrivateApp: App {
    @Environment(\.scenePhase) private var scenePhase
    @StateObject private var authentication: AuthenticationModel
    @StateObject private var sharedInbox = SharedInboxModel()
    @StateObject private var sync: SyncCoordinator
    @StateObject private var localIntelligence: LocalIntelligenceCoordinator
    @StateObject private var navigation: AppNavigationModel
    @State private var rss: RssReaderModel
    private let modelContainer: ModelContainer
    private let useListFixtures: Bool
    #if DEBUG
    private let rssFixtureClient: RssFixtureClient?
    @State private var openedArticleURL: URL?
    private var usesArticleFixtures: Bool {
        useListFixtures && ProcessInfo.processInfo.arguments.contains("-ui-testing-article-links")
    }

    private static var usesArticleThumbnails: Bool {
        ProcessInfo.processInfo.arguments.contains("-ui-testing-article-thumbnails")
    }
    #endif

    init() {
        #if DEBUG
        let useListFixtures = ProcessInfo.processInfo.arguments.contains("-ui-testing-list-fixtures")
        #else
        let useListFixtures = false
        #endif
        let authentication = AuthenticationModel()
        let container = try! ModelContainer(
            for: CachedMobileRecord.self, CachedMobileCategory.self, PendingMobileOperation.self, MobileSyncState.self, CachedRssSnapshot.self,
            configurations: ModelConfiguration(isStoredInMemoryOnly: useListFixtures)
        )
        let localIntelligence = LocalIntelligenceCoordinator(container: container, authentication: authentication)
        let navigation = AppNavigationModel()
        let coordinator = SyncCoordinator(
            container: container,
            authentication: authentication,
            localIntelligence: localIntelligence
        )
        _authentication = StateObject(wrappedValue: authentication)
        _sync = StateObject(wrappedValue: coordinator)
        _localIntelligence = StateObject(wrappedValue: localIntelligence)
        _navigation = StateObject(wrappedValue: navigation)
        AppDependencyManager.shared.add(dependency: localIntelligence)
        AppDependencyManager.shared.add(dependency: navigation)
        AppDependencyManager.shared.add(dependency: coordinator)
        modelContainer = container
        let client = MobileClient(authentication: authentication)
        #if DEBUG
        let fixture = useListFixtures ? RssFixtureClient() : nil
        rssFixtureClient = fixture
        let rssClient: any RssClient = fixture ?? client
        #else
        let rssClient: any RssClient = client
        #endif
        let rss = RssReaderModel(cache: RssCacheStore(container: container), client: rssClient,
                                 authenticated: { authentication.status == .authenticated }, monitorNetwork: !useListFixtures)
        rss.configure(owner: authentication.ownerKey, endpoint: client.baseURL?.absoluteString ?? "", signedIn: authentication.status == .authenticated)
        _rss = State(initialValue: rss)
        AppDependencyManager.shared.add(dependency: rss)
        self.useListFixtures = useListFixtures
        #if DEBUG
        if useListFixtures {
            if ProcessInfo.processInfo.arguments.contains("-ui-testing-rss-fixtures") {
                rss.useFixtures(offline: ProcessInfo.processInfo.arguments.contains("-ui-testing-rss-offline"), live: ProcessInfo.processInfo.arguments.contains("-ui-testing-rss-delayed"))
                if ProcessInfo.processInfo.arguments.contains("-ui-testing-rss-search-shortcut") {
                    navigation.showSavedRss("Saved article", readerIdentity: rss.identityID)
                }
            }
            var articleFixtures = [
                Self.fixtureRecord(id: "article-short", title: "Short article", categoryID: "reading"),
                Self.fixtureRecord(id: "article-long", title: "A long article title that wraps neatly across two lines", categoryID: "archive"),
            ]
            articleFixtures[1].ogDescription = "An overview of the article from its Open Graph metadata."
            if Self.usesArticleThumbnails {
                articleFixtures[1].ogImageUrl = "https://example.com/cover.jpg"
                var unavailable = Self.fixtureRecord(id: "article-no-cover", title: "Unavailable cover", categoryID: "reading")
                unavailable.ogImageUrl = "https://example.com/unavailable.jpg"
                articleFixtures.append(unavailable)
            }
            try! coordinator.cache(domain: .articles, records: articleFixtures)
            container.mainContext.insert(CachedMobileCategory(ownerKey: authentication.ownerKey, category: .init(id: "reading", name: "Reading")))
            container.mainContext.insert(CachedMobileCategory(ownerKey: authentication.ownerKey, category: .init(id: "archive", name: "Archive")))
            try! container.mainContext.save()
            try! coordinator.cache(domain: .notes, records: [
                Self.fixtureRecord(id: "note-short", title: "Short note"),
                Self.fixtureRecord(id: "note-long", title: "長いノートのタイトルでも、文字と遷移アイコンが重ならず二行で表示される"),
            ])
            try! coordinator.cache(domain: .books, records: [
                Self.fixtureRecord(id: "book-short", title: "Short book"),
                Self.fixtureRecord(id: "book-long", title: "A long book title that wraps across two lines"),
            ])
            if ProcessInfo.processInfo.arguments.contains("-ui-testing-paging-fixtures") {
                for domain in MobileDomain.allCases {
                    let records = (0..<32).map { index in
                        let record = Self.fixtureRecord(id: String(format: "page-%02d", index), title: index == 0 ? "Cross-domain \(domain.rawValue)" : "Paging \(domain.rawValue) \(index)", status: .exported, createdAt: Date(timeIntervalSince1970: Double(1000 - index)), imagePath: domain == .books ? "fixture.jpg" : nil,
                                                        markdown: domain == .notes ? (0..<60).map { "Paragraph \($0): Long note content for continuous paging." }.joined(separator: "\n\n") : nil,
                                                        categoryID: domain == .articles ? (index == 0 ? "archive" : "reading") : nil)
                        if domain == .images || domain == .books {
                            let image = UIGraphicsImageRenderer(size: CGSize(width: 60, height: 90)).jpegData(withCompressionQuality: 0.8) { context in
                                UIColor.systemBlue.setFill()
                                context.fill(CGRect(x: 0, y: 0, width: 60, height: 90))
                            }
                            try! coordinator.cacheMedia(image, domain: domain, id: record.id, variant: "original")
                        }
                        return record
                    }
                    try! coordinator.cache(domain: domain, records: records)
                }
            }
            if ProcessInfo.processInfo.arguments.contains("-ui-testing-deletion-fixtures") {
                for domain in MobileDomain.allCases {
                    try! coordinator.cache(domain: domain, records: [
                        Self.fixtureRecord(id: "exported-\(domain.rawValue)", title: "Exported \(domain.rawValue)", status: .exported),
                        Self.fixtureRecord(id: "unexported-\(domain.rawValue)", title: "Unexported \(domain.rawValue)"),
                    ])
                }
            }
        }
        #endif
    }

    var body: some Scene {
        WindowGroup {
            rootContent
                .tint(AppColors.primary)
                .environmentObject(authentication)
                .environmentObject(sharedInbox)
                .environmentObject(sync)
                .environmentObject(localIntelligence)
                .environmentObject(navigation)
                .environment(rss)
                .transformEnvironment(\.openURL) { action in
                    #if DEBUG
                    if useListFixtures && ProcessInfo.processInfo.arguments.contains("-ui-testing-rss-fixtures") {
                        action = OpenURLAction { _ in .handled }
                    } else if usesArticleFixtures {
                        action = OpenURLAction { url in
                            openedArticleURL = url
                            return .handled
                        }
                    }
                    #endif
                }
                .modelContainer(modelContainer)
                .onOpenURL { navigation.open(url: $0) }
                .task {
                    guard !useListFixtures else { return }
                    if authentication.status != .authenticated {
                        try? SharedCategoryStore().clear()
                    }
                    sharedInbox.reload()
                    sync.importSharedInbox()
                    await localIntelligence.activateCurrentOwner()
                    if authentication.status == .authenticated { await sync.synchronize() }
                }
                .onChange(of: scenePhase) { _, phase in
                    if phase == .active && !useListFixtures {
                        sharedInbox.reload()
                        sync.importSharedInbox()
                        if authentication.status == .authenticated { Task { await sync.synchronize() } }
                    }
                }
                .onChange(of: authentication.status) { _, status in
                    configureRss()
                    if status == .signedOut || status == .unavailable {
                        try? SharedCategoryStore().clear()
                        Task { await localIntelligence.prepareForSignOut() }
                    }
                    if status == .authenticated && !useListFixtures { Task { await sync.synchronize(force: true) } }
                }
                .onChange(of: authentication.ownerKey) { _, _ in
                    configureRss()
                    try? SharedCategoryStore().clear()
                    Task { await localIntelligence.activateCurrentOwner() }
                    if authentication.status == .authenticated && !useListFixtures {
                        Task { await sync.synchronize(force: true) }
                    }
                }
                .task(id: scenePhase) {
                    guard scenePhase == .active && !useListFixtures else { return }
                    while !Task.isCancelled {
                        try? await Task.sleep(for: .seconds(300))
                        guard !Task.isCancelled else { return }
                        if authentication.status == .authenticated { await sync.synchronize() }
                    }
                }
        }
    }

    @ViewBuilder
    private var rootContent: some View {
        #if DEBUG
        if ProcessInfo.processInfo.arguments.contains("-ui-testing-gallery") {
            ImageGalleryFixtureView()
        } else if ProcessInfo.processInfo.arguments.contains("-ui-testing-action-layout") {
            ActionLoadingFixtureView()
        } else if ProcessInfo.processInfo.arguments.contains("-ui-testing-media-layout") {
            MediaLoadingFixtureView()
        } else {
            ContentView(interpretSavedRssSearch: { [useListFixtures] query in
                if useListFixtures { return nil }
                return try await RssSavedIntelligence.interpret(query)
            })
                .environment(\.articleDeleteFailureFixtureID, usesArticleFixtures ? "article-long" : nil)
                .environment(\.feedThumbnailFixture, useListFixtures && Self.usesArticleThumbnails ? { url in
                    url.lastPathComponent == "cover.jpg" ? UIImage(systemName: "mountain.2.fill")?.withTintColor(.systemTeal) : nil
                } : nil)
                .safeAreaInset(edge: .top) {
                    if let rssFixtureClient, rssFixtureClient.controlledPages || rssFixtureClient.controlledMutations {
                        RssFixtureControls(client: rssFixtureClient)
                    }
                }
                .overlay(alignment: .top) {
                    if usesArticleFixtures, let openedArticleURL {
                        Text(openedArticleURL.absoluteString)
                            .font(.caption)
                            .accessibilityIdentifier("opened-article-url")
                            .allowsHitTesting(false)
                    }
                }
        }
        #else
        ContentView()
        #endif
    }

    private func configureRss() {
        rss.configure(owner: authentication.ownerKey,
                      endpoint: Bundle.main.object(forInfoDictionaryKey: "MobileAPIBaseURL") as? String ?? "",
                      signedIn: authentication.status == .authenticated)
    }

    #if DEBUG
    private static func fixtureRecord(id: String, title: String, status: MobileContentStatus = .unexported, createdAt: Date = .now, imagePath: String? = nil, markdown: String? = nil, categoryID: String? = nil) -> MobileRecord {
        MobileRecord(
            id: id, status: status, createdAt: createdAt, updatedAt: createdAt,
            exportedAt: nil, title: title, url: categoryID.map { _ in "https://example.com/\(id)" }, quote: nil, categoryId: categoryID,
            categoryName: nil, markdown: markdown, isbn: nil, rating: nil, tags: nil,
            path: nil, imagePath: imagePath, contentType: nil, fileSize: nil
        )
    }
    #endif
}
