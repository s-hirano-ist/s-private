import SwiftData
import Testing
@testable import SPrivate

@MainActor
struct ImageGalleryTests {
    @Test func includesUnrenderedImagesInFilteredListOrder() throws {
        let container = try ModelContainer(for: CachedMobileRecord.self, CachedMobileCategory.self, PendingMobileOperation.self, MobileSyncState.self,
                                           configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let sync = SyncCoordinator(container: container, authentication: AuthenticationModel())
        let records = (0..<35).map { ImageGalleryFixtureView.record($0, status: .exported) }
        try sync.cache(domain: .images, records: Array(records.reversed()) + [ImageGalleryFixtureView.record(99, status: .unexported)])
        #expect(sync.cachedPage(domain: .images, status: .exported, offset: 0).records.count == 30)
        let selection = sync.imageGallerySelection(status: .exported, selectedID: "gallery-29")
        #expect(selection.ids == records.map(\.id))
        #expect(selection.position == 29)
        #expect(sync.imageGallerySelection(status: .unexported, selectedID: "gallery-99").ids == ["gallery-99"])
    }

    @Test func deletionChoosesNextThenPreviousAndAllowsEmpty() {
        var selection = ImageGallerySelection(ids: ["a", "b", "c"], selectedID: "b")
        selection.retain(["a", "c"])
        #expect(selection.selectedID == "c")
        selection.retain(["a"])
        #expect(selection.selectedID == "a")
        selection.retain([])
        #expect(selection.ids.isEmpty)
    }

    @Test func synchronizationKeepsSelectionAndDoesNotInsertNewImages() {
        var selection = ImageGallerySelection(ids: ["a", "b", "c", "d"], selectedID: "b")
        selection.retain(["b", "c", "d", "new"])
        #expect(selection.ids == ["b", "c", "d"])
        #expect(selection.selectedID == "b")
        selection.retain(["c", "d", "new"])
        #expect(selection.selectedID == "c")
    }
}
