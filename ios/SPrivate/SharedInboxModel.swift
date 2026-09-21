import Foundation

@MainActor
final class SharedInboxModel: ObservableObject {
    @Published private(set) var items: [SharedInboxItem] = []
    @Published private(set) var errorMessage: String?

    func reload() {
        do {
            let store = try SharedInboxStore()
            try store.importPending()
            items = try store.loadImported()
            errorMessage = nil
        } catch SharedInboxStoreError.appGroupUnavailable {
            items = []
            errorMessage = "App Groupを利用できません。署名設定を確認してください。"
        } catch {
            items = []
            errorMessage = error.localizedDescription
        }
    }
}
