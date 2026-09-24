import SwiftUI
import SwiftData

@main
struct SPrivateApp: App {
    @Environment(\.scenePhase) private var scenePhase
    @StateObject private var authentication: AuthenticationModel
    @StateObject private var sharedInbox = SharedInboxModel()
    @StateObject private var sync: SyncCoordinator
    private let modelContainer: ModelContainer

    init() {
        let authentication = AuthenticationModel()
        let container = try! ModelContainer(for: CachedMobileRecord.self, CachedMobileCategory.self, PendingMobileOperation.self)
        _authentication = StateObject(wrappedValue: authentication)
        _sync = StateObject(wrappedValue: SyncCoordinator(container: container, authentication: authentication))
        modelContainer = container
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authentication)
                .environmentObject(sharedInbox)
                .environmentObject(sync)
                .modelContainer(modelContainer)
                .task {
                    sharedInbox.reload()
                    sync.importSharedInbox()
                    if authentication.status == .authenticated { await sync.synchronize() }
                }
                .onChange(of: scenePhase) { _, phase in
                    if phase == .active {
                        sharedInbox.reload()
                        sync.importSharedInbox()
                        if authentication.status == .authenticated { Task { await sync.synchronize() } }
                    }
                }
                .onChange(of: authentication.status) { _, status in
                    if status == .authenticated { Task { await sync.synchronize(force: true) } }
                }
                .task(id: scenePhase) {
                    guard scenePhase == .active else { return }
                    while !Task.isCancelled {
                        try? await Task.sleep(for: .seconds(300))
                        guard !Task.isCancelled else { return }
                        if authentication.status == .authenticated { await sync.synchronize() }
                    }
                }
        }
    }
}
