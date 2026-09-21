import SwiftUI

@main
struct SPrivateApp: App {
    @Environment(\.scenePhase) private var scenePhase
    @StateObject private var authentication = AuthenticationModel()
    @StateObject private var sharedInbox = SharedInboxModel()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authentication)
                .environmentObject(sharedInbox)
                .task {
                    sharedInbox.reload()
                }
                .onChange(of: scenePhase) { _, phase in
                    if phase == .active {
                        sharedInbox.reload()
                    }
                }
        }
    }
}
