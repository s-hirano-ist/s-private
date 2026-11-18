import SwiftUI
import SwiftData

@main
struct SPrivateApp: App {
    @Environment(\.scenePhase) private var scenePhase
    @StateObject private var authentication: AuthenticationModel
    @StateObject private var sharedInbox = SharedInboxModel()
    @StateObject private var sync: SyncCoordinator
    @State private var rss: RssReaderModel
    private let modelContainer: ModelContainer
    private let useListFixtures: Bool

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
        let coordinator = SyncCoordinator(container: container, authentication: authentication)
        _authentication = StateObject(wrappedValue: authentication)
        _sync = StateObject(wrappedValue: coordinator)
        modelContainer = container
        let client = MobileClient(authentication: authentication)
        #if DEBUG
        let rssClient: any RssClient = useListFixtures ? RssFixtureClient() : client
        #else
        let rssClient: any RssClient = client
        #endif
        let rss = RssReaderModel(cache: RssCacheStore(container: container), client: rssClient,
                                 authenticated: { authentication.status == .authenticated }, monitorNetwork: !useListFixtures)
        rss.configure(owner: authentication.ownerKey, endpoint: client.baseURL?.absoluteString ?? "", signedIn: authentication.status == .authenticated)
        _rss = State(initialValue: rss)
        self.useListFixtures = useListFixtures
        #if DEBUG
        if useListFixtures {
            if ProcessInfo.processInfo.arguments.contains("-ui-testing-rss-fixtures") {
                rss.useFixtures(offline: ProcessInfo.processInfo.arguments.contains("-ui-testing-rss-offline"), live: ProcessInfo.processInfo.arguments.contains("-ui-testing-rss-delayed"))
            }
            try! coordinator.cache(domain: .articles, records: [
                Self.fixtureRecord(id: "article-short", title: "Short article"),
                Self.fixtureRecord(id: "article-long", title: "A long article title that wraps neatly across two lines"),
            ])
            try! coordinator.cache(domain: .notes, records: [
                Self.fixtureRecord(id: "note-short", title: "Short note"),
                Self.fixtureRecord(id: "note-long", title: "長いノートのタイトルでも、文字と遷移アイコンが重ならず二行で表示される"),
            ])
            try! coordinator.cache(domain: .books, records: [
                Self.fixtureRecord(id: "book-short", title: "Short book"),
                Self.fixtureRecord(id: "book-long", title: "A long book title that wraps across two lines"),
            ])
            if ProcessInfo.processInfo.arguments.contains("-ui-testing-deletion-fixtures") {
                for domain in MobileDomain.allCases {
                    try! coordinator.cache(domain: domain, records: [
                        Self.fixtureRecord(id: "exported-\(domain.rawValue)", title: "Exported \(domain.rawValue)", status: .exported),
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
                .environment(rss)
                .transformEnvironment(\.openURL) { action in
                    #if DEBUG
                    if useListFixtures && ProcessInfo.processInfo.arguments.contains("-ui-testing-rss-fixtures") {
                        action = OpenURLAction { _ in .handled }
                    }
                    #endif
                }
                .modelContainer(modelContainer)
                .task {
                    guard !useListFixtures else { return }
                    if authentication.status != .authenticated {
                        try? SharedCategoryStore().clear()
                    }
                    sharedInbox.reload()
                    sync.importSharedInbox()
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
                    }
                    if status == .authenticated && !useListFixtures { Task { await sync.synchronize(force: true) } }
                }
                .onChange(of: authentication.ownerKey) { _, _ in
                    configureRss()
                    try? SharedCategoryStore().clear()
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
        if ProcessInfo.processInfo.arguments.contains("-ui-testing-media-layout") {
            MediaLoadingFixtureView()
        } else {
            ContentView()
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
    private static func fixtureRecord(id: String, title: String, status: MobileContentStatus = .unexported) -> MobileRecord {
        MobileRecord(
            id: id, status: status, createdAt: .now, updatedAt: .now,
            exportedAt: nil, title: title, url: nil, quote: nil, categoryId: nil,
            categoryName: nil, markdown: nil, isbn: nil, rating: nil, tags: nil,
            path: nil, imagePath: nil, contentType: nil, fileSize: nil
        )
    }
    #endif
}
