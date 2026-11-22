import Foundation
import SwiftData
import Testing
import SwiftUI
import UIKit
@testable import SPrivate

struct RecordPagingTests {
    private func page(_ id: String, _ domain: MobileDomain = .articles) -> RecordPageID {
        RecordPageID(domain: domain, id: id)
    }

    @Test("Starts at the tapped item and keeps cross-domain IDs distinct")
    func identityAndContinuation() {
        let article = page("same"), note = page("same", .notes)
        var state = RecordPagingState(pages: [article, note, article], selection: note, hasMore: true)
        #expect(state.pages == [article, note])
        #expect(state.selection == note)
        #expect(state.shouldLoadMore)
        state.append([note, page("older")], hasMore: false)
        #expect(state.pages == [article, note, page("older")])
        #expect(state.selection == note)
        #expect(!state.shouldLoadMore)
    }

    @Test("Requests the next page near the tail, including a single-item initial page")
    func loadingThreshold() {
        let pages = (0..<30).map { page(String($0)) }
        var state = RecordPagingState(pages: pages, selection: pages[0], hasMore: true)
        #expect(!state.shouldLoadMore)
        state.selection = pages[28]
        #expect(state.shouldLoadMore)
        state.append((30..<60).map { page(String($0)) }, hasMore: false)
        #expect(state.pages.count == 60)
        #expect(!state.shouldLoadMore)
        #expect(RecordPagingState(pages: [page("only")], selection: page("only"), hasMore: true).shouldLoadMore)
    }

    @Test("Sync removal selects the next survivor, then previous, without reordering")
    func removal() {
        let a = page("a"), b = page("b"), c = page("c"), d = page("d")
        var state = RecordPagingState(pages: [a, b, c, d], selection: b)
        state.retain { $0 != b && $0 != c }
        #expect(state.pages == [a, d])
        #expect(state.selection == d)
        state.retain { $0 != d }
        #expect(state.selection == a)
        state.retain { _ in false }
        #expect(state.pages.isEmpty)
    }

    @Test("Only current and adjacent media pages are instantiated")
    func mediaWindow() {
        let pages = (0..<8).map { page(String($0)) }
        let state = RecordPagingState(pages: pages, selection: pages[4])
        #expect(state.nearbyPages == Set(pages[3...5]))
    }

    @MainActor
    @Test("Keyset continuation keeps tied dates ordered and excludes new arrivals and other statuses")
    func cachedContinuation() throws {
        let container = try ModelContainer(
            for: CachedMobileRecord.self, CachedMobileCategory.self, PendingMobileOperation.self, MobileSyncState.self,
            configurations: ModelConfiguration(isStoredInMemoryOnly: true)
        )
        let sync = SyncCoordinator(container: container, authentication: AuthenticationModel())
        func record(_ index: Int, status: MobileContentStatus = .exported) -> MobileRecord {
            MobileRecord(id: String(format: "%03d", index), status: status,
                         createdAt: Date(timeIntervalSince1970: 100.123456), updatedAt: .now,
                         exportedAt: nil, title: "Record", url: nil, quote: nil, categoryId: nil,
                         categoryName: nil, markdown: nil, isbn: nil, rating: nil, tags: nil,
                         path: nil, imagePath: nil, contentType: nil, fileSize: nil)
        }
        try sync.cache(domain: .articles, records: (0..<65).map { record($0) })
        let first = sync.cachedPage(domain: .articles, status: .exported, offset: 0)
        #expect(first.records.count == 30)
        let anchor = try #require(first.records.last)
        try sync.cache(domain: .articles, records: [record(99), record(34, status: .unexported)])
        let second = sync.cachedPage(domain: .articles, status: .exported, after: anchor.id)
        #expect(second.records.map(\.id) == (4...33).reversed().map { String(format: "%03d", $0) })
        #expect(second.hasMore)
        let last = sync.cachedPage(domain: .articles, status: .exported, after: try #require(second.records.last).id)
        #expect(last.records.map(\.id) == ["003", "002", "001", "000"])
        #expect(!last.hasMore)
    }
}

@MainActor
struct RecordPagerTransitionTests {
    @MainActor
    private final class Harness {
        let ids = (0..<5).map { RecordPageID(domain: .notes, id: String($0)) }
        var pages: [RecordPageID]
        var selection: RecordPageID
        let controller = UIPageViewController(transitionStyle: .scroll, navigationOrientation: .horizontal)
        var pager: RecordPager<Text> {
            RecordPager(pages: pages, selection: Binding(get: { self.selection }, set: { self.selection = $0 }),
                        pagingEnabled: true) { Text($0.id) }
        }
        lazy var coordinator = pager.makeCoordinator()

        init() {
            pages = ids
            selection = ids[1]
            controller.dataSource = coordinator
            controller.delegate = coordinator
            coordinator.update(controller)
        }

        func beginNext() -> UIViewController {
            let next = coordinator.pageViewController(controller, viewControllerAfter: controller.viewControllers!.first!)!
            coordinator.pageViewController(controller, willTransitionTo: [next])
            return next
        }

        func refresh() {
            coordinator.parent = pager
            coordinator.update(controller)
        }

        func finish(_ next: UIViewController, completed: Bool) {
            let previous = controller.viewControllers!
            if completed { controller.setViewControllers([next], direction: .forward, animated: false) }
            coordinator.pageViewController(controller, didFinishAnimating: true,
                                           previousViewControllers: previous, transitionCompleted: completed)
        }
    }

    @Test("Interactive paging retains visible controllers and commits only after completion")
    func completionAndReuse() {
        let h = Harness()
        let original = h.controller.viewControllers!.first!
        let next = h.beginNext()
        h.refresh()
        #expect(h.selection == h.ids[1])
        #expect(h.controller.viewControllers!.first === original)
        #expect(h.coordinator.controllers[h.ids[2]] === next)
        h.finish(next, completed: true)
        #expect(h.selection == h.ids[2])
        #expect(h.controller.viewControllers!.first === next)
        #expect(Set(h.coordinator.controllers.keys) == Set(h.ids[1...3]))
        let previous = h.coordinator.pageViewController(h.controller, viewControllerBefore: next)
        #expect(previous === original)
    }

    @Test("Cancelled drags preserve selection and defer page additions until settling")
    func cancelAndAppend() {
        let h = Harness()
        let next = h.beginNext()
        let extra = RecordPageID(domain: .notes, id: "extra")
        h.pages.append(extra)
        h.refresh()
        #expect(!h.coordinator.appliedPages.contains(extra))
        h.finish(next, completed: false)
        #expect(h.selection == h.ids[1])
        #expect(h.coordinator.appliedPages.contains(extra))
        #expect((h.controller.viewControllers!.first as? RecordPager<Text>.PageController)?.id == h.ids[1])
    }

    @Test("Sync removal of a pending page applies only after the transition")
    func pendingRemoval() {
        let h = Harness()
        let original = h.controller.viewControllers!.first!
        let next = h.beginNext()
        h.pages.removeAll { $0 == h.ids[2] }
        h.refresh()
        #expect(h.coordinator.appliedPages.contains(h.ids[2]))
        #expect(h.controller.viewControllers!.first === original)
        h.finish(next, completed: true)
        #expect(h.selection == h.ids[1])
        #expect(h.controller.viewControllers!.first === original)
        #expect(!h.coordinator.appliedPages.contains(h.ids[2]))
    }

    @Test("Sync selection replacement wins over an in-flight gesture")
    func selectedRemoval() {
        let h = Harness()
        let next = h.beginNext()
        h.pages.removeAll { $0 == h.ids[1] || $0 == h.ids[2] }
        h.selection = h.ids[3]
        h.refresh()
        h.finish(next, completed: true)
        #expect(h.selection == h.ids[3])
        #expect((h.controller.viewControllers!.first as? RecordPager<Text>.PageController)?.id == h.ids[3])
    }
}
