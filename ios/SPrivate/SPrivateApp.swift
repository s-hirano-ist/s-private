import SwiftUI
import SwiftData

@main
struct SPrivateApp: App {
    @Environment(\.scenePhase) private var scenePhase
    @StateObject private var authentication: AuthenticationModel
    @StateObject private var sharedInbox = SharedInboxModel()
    @StateObject private var sync: SyncCoordinator
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
            for: CachedMobileRecord.self, CachedMobileCategory.self, PendingMobileOperation.self, MobileSyncState.self,
            configurations: ModelConfiguration(isStoredInMemoryOnly: useListFixtures)
        )
        let coordinator = SyncCoordinator(container: container, authentication: authentication)
        _authentication = StateObject(wrappedValue: authentication)
        _sync = StateObject(wrappedValue: coordinator)
        modelContainer = container
        self.useListFixtures = useListFixtures
        #if DEBUG
        if useListFixtures {
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
        }
        #endif
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .tint(AppColors.primary)
                .environmentObject(authentication)
                .environmentObject(sharedInbox)
                .environmentObject(sync)
                .modelContainer(modelContainer)
                .task {
                    guard !useListFixtures else { return }
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
                    if status == .authenticated && !useListFixtures { Task { await sync.synchronize(force: true) } }
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

    #if DEBUG
    private static func fixtureRecord(id: String, title: String) -> MobileRecord {
        MobileRecord(
            id: id, status: .unexported, createdAt: .now, updatedAt: .now,
            exportedAt: nil, title: title, url: nil, quote: nil, categoryId: nil,
            categoryName: nil, markdown: nil, isbn: nil, rating: nil, tags: nil,
            path: nil, imagePath: nil, contentType: nil, fileSize: nil
        )
    }
    #endif
}
