import Foundation
import SPrivateAPI
import SwiftData
import Testing
import ZIPFoundation

@testable import SPrivate

@MainActor
private final class RssTestClient: RssClient {
    var feeds: [RssFeed] = [.init(id: "feed", url: "https://example.com/feed", title: "Feed", lastFetchedAt: .now)]
    var unread: [RssEntry] = []
    var saved: [RssEntry] = [] {
        didSet { stars = Dictionary(saved.map { ($0.url, $0.id) }, uniquingKeysWith: { first, _ in first }) }
    }
    private var stars: [String: String] = [:]
    var pageDelay: Duration?
    var requests: [(RssList, Int)] = []
    var reads: [[String]] = []
    var refreshes = 0
    var activeRefreshes = 0
    var maxConcurrentRefreshes = 0
    var failedFeedID: String?
    var failOffset: Int?
    var failRead = false
    var beforePage: (() async -> Void)?
    var beforeRead: (() async -> Void)?
    var beforeSave: (() async -> Void)?
    var beforeRefresh: (() async -> Void)?
    var beforeImport: (() async -> Void)?
    var saveCalls = 0
    var saveResponse: RssEntry?
    var changedRefresh = false
    var revision = 0
    var entryRevisions: [String: Int] = [:]
    var requestedRevisions: [Int?] = []
    var events: [String] = []
    var failedReadIDs: Set<String> = []
    var importCount = 0
    var failImportAt: Int?
    func rssPage(_ list: RssList, offset: Int, snapshotRevision: Int?) async throws -> RssPage {
        requests.append((list, offset))
        requestedRevisions.append(snapshotRevision)
        let boundary = snapshotRevision ?? revision
        let entries = list == .unread ? (entryRevisions.isEmpty ? unread : unread.filter { (entryRevisions[$0.id] ?? 0) <= boundary }) : saved
        var pageEntries = Array(entries.dropFirst(offset).prefix(50))
        if list == .unread {
            for index in pageEntries.indices { pageEntries[index].savedID = stars[pageEntries[index].url] }
        }
        let page = RssPage(feeds: feeds, entries: pageEntries, count: entries.count, offset: offset, snapshotRevision: boundary)
        if let pageDelay { try await Task.sleep(for: pageDelay) }
        if let beforePage { await beforePage() }
        if failOffset == offset { throw URLError(.networkConnectionLost) }
        return page
    }
    func rssFeeds() async throws -> [RssFeed] { feeds }
    func rssSubscribe(url: String, title: String, folder: String) async throws {
        feeds.append(.init(id: UUID().uuidString, url: url, title: title, folder: folder, lastFetchedAt: .now))
    }
    func rssUnsubscribe(id: String) async throws {
        feeds.removeAll { $0.id == id }
        unread.removeAll { $0.feedID == id }
    }
    func rssRead(ids: [String]) async throws {
        reads.append(ids)
        events.append("read")
        if let beforeRead { await beforeRead() }
        if failRead || !failedReadIDs.isDisjoint(with: ids) { throw URLError(.networkConnectionLost) }
        unread.removeAll { ids.contains($0.id) }
    }
    func rssSave(_ entry: RssEntry) async throws -> RssEntry {
        saveCalls += 1
        events.append("save")
        if let beforeSave { await beforeSave() }
        if let saveResponse { saved.append(saveResponse); return saveResponse }
        saved.append(
            .init(
                id: "saved-\(entry.id)", url: entry.url, title: entry.title, imageURL: entry.imageURL,
                savedID: "saved-\(entry.id)"))
        return saved.last!
    }
    func rssUnsave(id: String) async throws { saved.removeAll { $0.id == id } }
    func rssRefresh(id: String, force: Bool) async throws -> Components.Schemas.RssRefreshResult {
        refreshes += 1
        if let beforeRefresh { await beforeRefresh() }
        activeRefreshes += 1
        maxConcurrentRefreshes = max(maxConcurrentRefreshes, activeRefreshes)
        defer { activeRefreshes -= 1 }
        try await Task.sleep(for: .milliseconds(5))
        return .init(data: [.init(id: id, changed: changedRefresh, status: id == failedFeedID ? .failed : .skipped)])
    }
    func rssImport(_ batch: RssImportBatch) async throws -> Components.Schemas.RssImportResult {
        importCount += 1
        events.append("import")
        if let beforeImport { await beforeImport() }
        if failImportAt == importCount { throw URLError(.networkConnectionLost) }
        return .init(added: 100, duplicates: 0, invalid: 0)
    }
}

@MainActor
struct RssTests {
    private func container() throws -> ModelContainer {
        try ModelContainer(for: CachedRssSnapshot.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
    }
    private func model(_ client: RssTestClient, container: ModelContainer) -> RssReaderModel {
        let model = RssReaderModel(cache: .init(container: container), client: client, monitorNetwork: false)
        model.configure(owner: "owner", endpoint: "https://example.com/api/v1", signedIn: true)
        return model
    }
    private func entry(_ index: Int, saved: Bool = false) -> RssEntry {
        .init(
            id: "\(saved ? "saved" : "unread")-\(index)", feedID: saved ? nil : "feed",
            url: "https://example.com/\(index)", title: "Article \(index)",
            receivedAt: Date(timeIntervalSince1970: Double(index)), savedID: saved ? "saved-\(index)" : nil)
    }

    @Test("Adding RSS cache storage preserves the existing content sync cursor")
    func existingStoreMigration() async throws {
        let directory = FileManager.default.temporaryDirectory.appending(path: UUID().uuidString)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: directory) }
        let url = directory.appending(path: "cache.store")
        func createExistingStore() throws {
            let old = try ModelContainer(
                for: CachedMobileRecord.self, CachedMobileCategory.self,
                PendingMobileOperation.self, MobileSyncState.self,
                configurations: ModelConfiguration(url: url))
            let context = ModelContext(old)
            let state = MobileSyncState(ownerKey: "owner")
            state.cursor = "existing-cursor"
            context.insert(state)
            try context.save()
        }
        try createExistingStore()
        let updated = try ModelContainer(
            for: CachedMobileRecord.self, CachedMobileCategory.self,
            PendingMobileOperation.self, MobileSyncState.self, CachedRssSnapshot.self,
            configurations: ModelConfiguration(url: url))
        let context = ModelContext(updated)
        #expect(try context.fetch(FetchDescriptor<MobileSyncState>()).first?.cursor == "existing-cursor")
        let cache = RssCacheStore(container: updated)
        try await cache.save(RssSnapshot(unread: [entry(0)]), scope: "owner-api")
        #expect(try await cache.load(scope: "owner-api")?.unread.count == 1)
    }

    @Test("Every unread/saved page is cached and survives a new model instance")
    func completeCache() async throws {
        let container = try container()
        let client = RssTestClient()
        client.unread = (0..<121).map { entry($0) }
        client.saved = (0..<65).map { entry($0, saved: true) }
        let rss = model(client, container: container)
        await rss.synchronize()
        #expect(rss.isComplete)
        #expect(rss.snapshot.unread.count == 121)
        #expect(rss.snapshot.saved.count == 65)
        #expect(client.requests.filter { $0.0 == .unread }.map(\.1) == [0, 50, 100, 0])
        #expect(rss.snapshot.unread[0].savedID == "saved-0")
        let restored = model(client, container: container)
        await restored.restoreCache()
        restored.setOnline(false)
        #expect(restored.snapshot == rss.snapshot)
        #expect(!restored.canMutate)
        await restored.synchronize(manual: true)
        #expect(client.refreshes == 0)
    }

    @Test("A partial download cannot replace the last complete generation")
    func interruptedDownload() async throws {
        let container = try container()
        let client = RssTestClient()
        client.unread = [entry(0)]
        let rss = model(client, container: container)
        await rss.synchronize()
        let old = rss.snapshot
        client.unread = (0..<80).map { entry($0) }
        client.failOffset = 50
        await rss.synchronize(manual: true)
        #expect(rss.snapshot == old)
        let restored = model(client, container: container)
        await restored.restoreCache()
        #expect(restored.snapshot == old)
        #expect(rss.errorMessage != nil)
    }

    @Test("Repeated pages retry once without an infinite loop")
    func changingPages() async throws {
        let client = RssTestClient()
        client.unread = (0..<51).map { _ in entry(0) }
        let rss = model(client, container: try container())
        await rss.synchronize()
        #expect(!rss.isComplete)
        #expect(rss.errorMessage != nil)
        #expect(client.requests.count == 2)
    }

    @Test("Owner, endpoint and sign-out isolate cached metadata and clear stale responses")
    func scopeIsolation() async throws {
        let container = try container()
        let client = RssTestClient()
        client.unread = [entry(0)]
        let rss = model(client, container: container)
        await rss.synchronize()
        rss.configure(owner: "other", endpoint: "https://example.com/api/v1", signedIn: true)
        #expect(rss.snapshot.unread.isEmpty)
        rss.configure(owner: "owner", endpoint: "https://other.example/api/v1", signedIn: true)
        #expect(rss.snapshot.unread.isEmpty)
        rss.configure(owner: "owner", endpoint: "https://example.com/api/v1", signedIn: true)
        await rss.restoreCache()
        #expect(rss.snapshot.unread.count == 1)
        rss.configure(owner: "owner", endpoint: "https://example.com/api/v1", signedIn: false)
        #expect(rss.snapshot.unread.isEmpty)
        #expect(!rss.canMutate)
    }

    @Test("A response started by the previous owner cannot update another owner's cache")
    func staleOwnerResponse() async throws {
        let client = RssTestClient()
        client.unread = [entry(0)]
        let rss = model(client, container: try container())
        client.beforePage = {
            rss.configure(owner: "other", endpoint: "https://example.com/api/v1", signedIn: true)
        }
        await rss.synchronize()
        #expect(rss.snapshot.unread.isEmpty)
        #expect(!rss.isComplete)
    }

    @Test("Bulk reads batch captured IDs and leave new arrivals unread")
    func readBoundary() async throws {
        let client = RssTestClient()
        client.unread = (0..<121).map { entry($0) }
        let rss = model(client, container: try container())
        await rss.synchronize()
        let captured = rss.snapshot.unread
        client.unread.insert(entry(999), at: 0)
        await rss.markRead(captured)
        #expect(client.reads.map(\.count) == [100, 21])
        #expect(!client.reads.flatMap { $0 }.contains("unread-999"))
        #expect(rss.snapshot.unread.isEmpty)
        await rss.synchronize(manual: true)
        #expect(rss.snapshot.unread.map(\.id) == ["unread-999"])
    }

    @Test("Ambiguous mutation failures are reconciled without resending")
    func noMutationRetry() async throws {
        let client = RssTestClient()
        client.unread = [entry(0)]
        client.failRead = true
        let rss = model(client, container: try container())
        await rss.synchronize()
        await rss.markRead(rss.snapshot.unread)
        #expect(client.reads.count == 1)
        #expect(rss.snapshot.unread.count == 1)
        #expect(rss.errorMessage != nil)
    }

    @Test("Save/unsave and unsubscribe preserve the independent saved list")
    func savedLifecycle() async throws {
        let client = RssTestClient()
        client.unread = [entry(0)]
        let rss = model(client, container: try container())
        await rss.synchronize()
        await rss.toggleSaved(rss.snapshot.unread[0])
        #expect(rss.snapshot.unread[0].savedID != nil)
        #expect(rss.snapshot.saved.count == 1)
        await rss.unsubscribe(client.feeds[0])
        #expect(rss.snapshot.unread.isEmpty)
        #expect(rss.snapshot.saved.count == 1)
        await rss.toggleSaved(rss.snapshot.saved[0])
        #expect(rss.snapshot.saved.isEmpty)
    }

    @Test("Automatic and manual metadata refreshes never poll external feeds, even for stale subscriptions")
    func databaseOnlyRefresh() async throws {
        let client = RssTestClient()
        client.feeds = (0..<12).map { .init(id: "feed-\($0)", url: "https://example.com/\($0)", title: "Feed") }
        let rss = model(client, container: try container())
        await rss.synchronize()
        await rss.synchronize(manual: true)
        #expect(client.refreshes == 0)
        #expect(client.requests.count == 8)
        #expect(rss.isComplete)
        #expect(rss.errorMessage == nil)
    }

    @Test("Opening an article during a pending mutation queues the read instead of dropping it")
    func queuedReads() async throws {
        let client = RssTestClient()
        client.unread = [entry(0), entry(1)]
        let rss = model(client, container: try container())
        await rss.synchronize()
        var continuation: CheckedContinuation<Void, Never>?
        client.beforeRead = { await withCheckedContinuation { continuation = $0 } }
        let first = Task { await rss.markRead([self.entry(0)]) }
        while continuation == nil { await Task.yield() }
        let second = Task { await rss.markRead([self.entry(1)]) }
        await Task.yield()
        client.beforeRead = nil
        continuation?.resume()
        await first.value
        await second.value
        while client.reads.count < 2 || rss.isMutating { await Task.yield() }
        #expect(client.reads == [["unread-0"], ["unread-1"]])
        #expect(rss.snapshot.unread.isEmpty)
    }

    @Test("A late mutation cannot persist data after the owner changes")
    func staleMutation() async throws {
        let container = try container()
        let client = RssTestClient()
        client.unread = [entry(0)]
        let rss = model(client, container: container)
        await rss.synchronize()
        client.beforeRead = { rss.configure(owner: "other", endpoint: "https://example.com/api/v1", signedIn: true) }
        await rss.markRead([entry(0)])
        #expect(rss.snapshot.unread.isEmpty)
        #expect(!rss.isComplete)
        let restored = model(client, container: container)
        await restored.restoreCache()
        #expect(!restored.snapshot.unread.isEmpty)
    }

    @Test("Clearing the cache deletes every RSS scope")
    func clearCache() async throws {
        let container = try container()
        let client = RssTestClient()
        client.unread = [entry(0)]
        let rss = model(client, container: container)
        await rss.synchronize()
        rss.clearCache()
        #expect(rss.snapshot.unread.isEmpty)
        await rss.restoreCache()
        let restored = model(client, container: container)
        await restored.restoreCache()
        #expect(!restored.isComplete)
    }

    @Test("Starred imports strip article bodies, preserve metadata and split batches")
    func importMetadata() throws {
        let items = (0..<201).map {
            [
                "title": "Article \($0)", "url": "https://example.com/\($0)", "summary": "PRIVATE BODY",
                "content": "PRIVATE BODY",
            ]
        }
        let data = try JSONSerialization.data(withJSONObject: ["items": items])
        let batches = try RssImport.batches(data, kind: .starred)
        #expect(batches.count == 3)
        #expect(!batches.map(\.content).joined().contains("PRIVATE BODY"))
        #expect(batches[0].content.contains("title"))
        #expect(throws: (any Error).self) { try RssImport.batches(Data("broken".utf8), kind: .starred) }
        #expect(throws: RssError.self) {
            try RssImport.batches(Data(repeating: 1, count: RssImport.maxExpandedBytes + 1), kind: .opml)
        }
    }

    @Test("ZIP reads only subscription and starred exports")
    func zipImport() throws {
        let root = FileManager.default.temporaryDirectory.appending(path: UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: root) }
        let source = root.appending(path: "export")
        try FileManager.default.createDirectory(at: source, withIntermediateDirectories: true)
        try Data("<opml><body/></opml>".utf8).write(to: source.appending(path: "subscriptions.xml"))
        try Data(#"{"items":[{"title":"Saved","url":"https://example.com","content":"PRIVATE BODY"}]}"#.utf8).write(
            to: source.appending(path: "starred.json"))
        try Data("ignored".utf8).write(to: source.appending(path: "unread.json"))
        let zip = root.appending(path: "export.zip")
        try FileManager.default.zipItem(at: source, to: zip, compressionMethod: .deflate)
        let batches = try RssImport.read(zip)
        #expect(batches.count == 2)
        #expect(batches.contains { $0.kind == .opml })
        #expect(!batches.map(\.content).joined().contains("PRIVATE BODY"))
    }

    @Test("Import failure keeps completed totals and never retries the failed batch")
    func partialImport() async throws {
        let client = RssTestClient()
        client.failImportAt = 2
        let rss = model(client, container: try container())
        let url = FileManager.default.temporaryDirectory.appending(path: UUID().uuidString).appending(
            path: "starred.json")
        try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: url.deletingLastPathComponent()) }
        let items = (0..<101).map { ["title": "Article \($0)", "url": "https://example.com/\($0)"] }
        try JSONSerialization.data(withJSONObject: items).write(to: url)
        await rss.importFile(url)
        #expect(client.importCount == 2)
        #expect(rss.importSummary != nil)
        #expect(rss.errorMessage != nil)
    }
}

extension RssTests {
    private enum WaitFailure: Error { case timedOut }
    private func waitFor(_ condition: @MainActor () -> Bool) async throws {
        let deadline = ContinuousClock.now + .seconds(5)
        while !condition() {
            if ContinuousClock.now >= deadline { throw WaitFailure.timedOut }
            await Task.yield()
        }
    }

    @Test("Controlled UI fixture serves the first page and holds later pages until release")
    func controlledFixturePages() async throws {
        let client = RssFixtureClient(delayed: false, controlledPages: true)
        client.holdRemainingPages()
        let first = try await client.rssPage(.unread, offset: 0, snapshotRevision: nil)
        #expect(first.entries.count == 50)
        #expect(!client.isPagePending)
        let remaining = Task { try await client.rssPage(.unread, offset: 50, snapshotRevision: nil) }
        defer { client.releaseRemainingPages() }
        try await waitFor { client.isPagePending }
        #expect(client.holdsRemainingPages)
        client.releaseRemainingPages()
        let page = try await remaining.value
        #expect(page.offset == 50)
        #expect(page.entries.count == 50)
        #expect(!client.isPagePending)
        #expect(!client.holdsRemainingPages)
    }

    @Test("Cancelling a held fixture page leaves the next request independently releasable")
    func cancelledFixturePage() async throws {
        let client = RssFixtureClient(delayed: false, controlledPages: true)
        client.holdRemainingPages()
        let cancelled = Task { try await client.rssPage(.unread, offset: 50, snapshotRevision: nil) }
        defer { client.releaseRemainingPages() }
        try await waitFor { client.isPagePending }
        cancelled.cancel()
        do {
            _ = try await cancelled.value
            Issue.record("Cancelled fixture request returned a page")
        } catch is CancellationError { }
        #expect(!client.isPagePending)
        #expect(client.holdsRemainingPages)
        let next = Task { try await client.rssPage(.unread, offset: 50, snapshotRevision: nil) }
        try await waitFor { client.isPagePending }
        client.releaseRemainingPages()
        let page = try await next.value
        #expect(page.offset == 50)
        #expect(!client.isPagePending)
    }

    @Test("Save inputs queued during a held metadata page survive reconciliation")
    func queuedSavesDuringHeldPage() async throws {
        let client = RssTestClient()
        client.unread = (0..<51).map { entry($0) }
        let rss = model(client, container: try container())
        await rss.synchronize()
        var release: CheckedContinuation<Void, Never>?
        client.beforePage = {
            guard client.requests.last?.1 == 50 else { return }
            client.beforePage = nil
            await withCheckedContinuation { release = $0 }
        }
        defer { release?.resume() }
        let refresh = Task { await rss.synchronize(manual: true) }
        try await waitFor { release != nil }
        let first = Task { await rss.toggleSaved(self.entry(0)) }
        try await waitFor { rss.snapshot.saved.contains { $0.url == self.entry(0).url } }
        let second = Task { await rss.toggleSaved(self.entry(1)) }
        try await waitFor { !rss.canSave(self.entry(1)) }
        #expect(rss.isLoading)
        #expect(rss.canSave(entry(2)))
        release?.resume()
        release = nil
        await refresh.value
        await first.value
        await second.value
        #expect(client.saveCalls == 2)
        #expect(Set(rss.snapshot.saved.map(\.url)) == Set([entry(0).url, entry(1).url]))
        #expect(rss.snapshot.unread.first { $0.id == entry(0).id }?.savedID != nil)
        #expect(rss.snapshot.unread.first { $0.id == entry(1).id }?.savedID != nil)
    }

    @Test("Successful single-entry mutations perform zero metadata GETs")
    func mutationsDoNotRedownload() async throws {
        let client = RssTestClient()
        client.unread = [entry(0), entry(1)]
        let rss = model(client, container: try container())
        await rss.synchronize()
        let requests = client.requests.count
        await rss.toggleSaved(entry(0))
        #expect(rss.snapshot.unread[0].savedID == "saved-unread-0")
        await rss.markRead([entry(0)])
        await rss.toggleSaved(rss.snapshot.saved[0])
        #expect(client.requests.count == requests)
        #expect(rss.snapshot.saved.isEmpty)
        #expect(rss.snapshot.unread.map(\.id) == ["unread-1"])
    }

    @Test("An existing saved response keeps the server timestamp and saved-list ordering")
    func existingSaveOrdering() async throws {
        let client = RssTestClient()
        client.unread = [entry(0)]
        client.saved = [entry(11, saved: true), entry(10, saved: true)]
        client.saveResponse = .init(id: "existing", url: entry(0).url, title: "Original", receivedAt: Date(timeIntervalSince1970: -1), savedID: "existing")
        let rss = model(client, container: try container())
        await rss.synchronize()
        await rss.toggleSaved(entry(0))
        #expect(rss.snapshot.saved.map(\.id) == ["saved-11", "saved-10", "existing"])
        #expect(rss.snapshot.unread[0].savedID == "existing")
    }

    @Test("Concurrent refresh gestures coalesce into one DB metadata pass")
    func coalescedRefresh() async throws {
        let client = RssTestClient()
        client.unread = [entry(0)]
        client.feeds = (0..<12).map { .init(id: "feed-\($0)", url: "https://example.com/\($0)", title: "Feed") }
        client.changedRefresh = true
        let rss = model(client, container: try container())
        var release: CheckedContinuation<Void, Never>?
        client.beforePage = {
            client.beforePage = nil
            await withCheckedContinuation { release = $0 }
        }
        let first = Task { await rss.synchronize(manual: true) }
        try await waitFor { release != nil }
        let joined = (0..<5).map { _ in Task { await rss.synchronize(manual: true) } }
        for _ in 0..<10 { await Task.yield() }
        release?.resume()
        await first.value
        for task in joined { await task.value }
        #expect(client.refreshes == 0)
        #expect(client.requests.count == 4)
        #expect(!rss.isLoading)
    }

    @Test("A metadata response captured before a successful read cannot resurrect the article")
    func readDuringDownload() async throws {
        let container = try container()
        let client = RssTestClient()
        client.unread = [entry(0), entry(1)]
        let rss = model(client, container: container)
        await rss.synchronize()
        var release: CheckedContinuation<Void, Never>?
        client.beforePage = {
            client.beforePage = nil
            await withCheckedContinuation { release = $0 }
        }
        let refresh = Task { await rss.synchronize(manual: true) }
        try await waitFor { release != nil }
        let read = Task { await rss.markRead([self.entry(0)]) }
        try await waitFor { client.reads.count == 1 }
        release?.resume()
        await refresh.value
        await read.value
        #expect(rss.snapshot.unread.map(\.id) == ["unread-1"])
        let restored = model(client, container: container)
        await restored.restoreCache()
        #expect(restored.snapshot.unread.map(\.id) == ["unread-1"])
    }

    @Test("A read during DB synchronization survives the download and duplicate read intents are removed")
    func readDuringSynchronization() async throws {
        let client = RssTestClient()
        client.unread = [entry(0), entry(1)]
        let rss = model(client, container: try container())
        await rss.synchronize()
        var release: CheckedContinuation<Void, Never>?
        client.beforePage = {
            client.beforePage = nil
            await withCheckedContinuation { release = $0 }
        }
        let refresh = Task { await rss.synchronize(manual: true) }
        try await waitFor { release != nil }
        let read = Task { await rss.markRead([self.entry(0), self.entry(0)]) }
        try await waitFor { client.reads.count == 1 }
        #expect(rss.isLoading)
        release?.resume()
        await refresh.value
        await read.value
        #expect(client.reads == [["unread-0"]])
        #expect(rss.snapshot.unread.map(\.id) == ["unread-1"])
    }

    @Test("Pull-to-refresh finishes after the first DB page while the full offline copy continues")
    func foregroundRefreshBoundary() async throws {
        for list in RssList.allCases {
            let client = RssTestClient()
            client.unread = (0..<121).map { entry($0) }
            client.saved = (0..<121).map { entry($0, saved: true) }
            let rss = model(client, container: try container())
            var release: CheckedContinuation<Void, Never>?
            client.beforePage = {
                guard client.requests.last?.1 == 50 else { return }
                client.beforePage = nil
                await withCheckedContinuation { release = $0 }
            }
            await rss.refresh(list)
            try await waitFor { release != nil }
            #expect(rss.isLoading)
            #expect(!rss.isComplete)
            #expect(!rss.snapshot.unread.isEmpty)
            release?.resume()
            await rss.synchronize()
            #expect(rss.isComplete)
            #expect(!rss.isLoading)
            #expect(rss.snapshot.unread.count == 121)
            #expect(rss.snapshot.saved.count == 121)
            #expect(client.refreshes == 0)
        }
    }

    @Test("A failed first page releases refresh waiters and keeps the complete cached generation")
    func failedForegroundRefresh() async throws {
        let client = RssTestClient()
        client.unread = [entry(0)]
        let rss = model(client, container: try container())
        await rss.synchronize()
        let old = rss.snapshot
        client.failOffset = 0
        await rss.refresh(.unread)
        #expect(!rss.isLoading)
        #expect(rss.snapshot == old)
        #expect(rss.errorMessage != nil)
    }

    @Test("Cancelling the refresh gesture releases its waiter while the DB copy keeps running")
    func cancelledForegroundRefresh() async throws {
        let client = RssTestClient()
        let rss = model(client, container: try container())
        var release: CheckedContinuation<Void, Never>?
        client.beforePage = {
            client.beforePage = nil
            await withCheckedContinuation { release = $0 }
        }
        let refresh = Task { await rss.refresh(.unread) }
        try await waitFor { release != nil }
        refresh.cancel()
        await refresh.value
        #expect(rss.isLoading)
        release?.resume()
        await rss.synchronize()
        #expect(rss.isComplete)
    }

    @Test("Logout releases pending refresh waiters and fences the old first-page response")
    func invalidatedForegroundRefresh() async throws {
        let client = RssTestClient()
        client.unread = [entry(0)]
        let rss = model(client, container: try container())
        var release: CheckedContinuation<Void, Never>?
        client.beforePage = {
            client.beforePage = nil
            await withCheckedContinuation { release = $0 }
        }
        let refresh = Task { await rss.refresh(.saved) }
        try await waitFor { release != nil }
        rss.configure(owner: "owner", endpoint: "https://example.com/api/v1", signedIn: false)
        await refresh.value
        release?.resume()
        #expect(!rss.isLoading)
        #expect(rss.snapshot.unread.isEmpty)
    }

    @Test("Saving another article stays available while the same article's duplicate saves are suppressed")
    func queuedSaves() async throws {
        let client = RssTestClient()
        client.unread = [entry(0), entry(1)]
        let rss = model(client, container: try container())
        await rss.synchronize()
        var release: CheckedContinuation<Void, Never>?
        client.beforeSave = {
            client.beforeSave = nil
            await withCheckedContinuation { release = $0 }
        }
        let first = Task { await rss.toggleSaved(self.entry(0)) }
        try await waitFor { release != nil }
        #expect(!rss.canSave(entry(0)))
        #expect(rss.canSave(entry(1)))
        await rss.toggleSaved(entry(0))
        let second = Task { await rss.toggleSaved(self.entry(1)) }
        for _ in 0..<10 { await Task.yield() }
        release?.resume()
        await first.value
        await second.value
        #expect(client.saveCalls == 2)
        #expect(rss.snapshot.saved.count == 2)
    }

    @Test("A late browser callback for an already read article does not send another mutation")
    func alreadyReadCallback() async throws {
        let client = RssTestClient()
        client.unread = [entry(0)]
        let rss = model(client, container: try container())
        await rss.synchronize()
        let captured = entry(0)
        await rss.markRead([captured])
        await rss.markRead([captured])
        #expect(client.reads == [["unread-0"]])
    }

    @Test("Overlapping concurrent read batches deduplicate after async cache restoration")
    func overlappingReadIntents() async throws {
        let client = RssTestClient()
        client.unread = [entry(0), entry(1)]
        let rss = model(client, container: try container())
        await rss.synchronize()
        var release: CheckedContinuation<Void, Never>?
        client.beforeRead = {
            client.beforeRead = nil
            await withCheckedContinuation { release = $0 }
        }
        let first = Task { await rss.markRead([self.entry(0)]) }
        try await waitFor { release != nil }
        let second = Task { await rss.markRead([self.entry(0), self.entry(1)]) }
        for _ in 0..<10 { await Task.yield() }
        release?.resume()
        await first.value
        await second.value
        #expect(client.reads.flatMap { $0 }.sorted() == ["unread-0", "unread-1"])
    }

    @Test("Interactive saves run between bulk read batches")
    func bulkReadInterleaving() async throws {
        let client = RssTestClient()
        client.unread = (0..<201).map { entry($0) }
        let rss = model(client, container: try container())
        await rss.synchronize()
        var release: CheckedContinuation<Void, Never>?
        client.beforeRead = {
            client.beforeRead = nil
            await withCheckedContinuation { release = $0 }
        }
        let bulk = Task { await rss.markRead(client.unread) }
        try await waitFor { release != nil }
        let save = Task { await rss.toggleSaved(self.entry(0)) }
        try await waitFor { !rss.canSave(entry(0)) }
        release?.resume()
        await bulk.value
        await save.value
        #expect(client.events == ["read", "save", "read", "read"])
        #expect(rss.snapshot.unread.isEmpty)
        #expect(rss.snapshot.saved.count == 1)
    }

    @Test("A completed save can be reversed while another import batch remains in flight")
    func saveWhileImporting() async throws {
        let client = RssTestClient()
        client.unread = [entry(0)]
        let rss = model(client, container: try container())
        await rss.synchronize()
        let directory = FileManager.default.temporaryDirectory.appending(path: UUID().uuidString)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: directory) }
        let url = directory.appending(path: "starred.json")
        let items = (0..<201).map { ["title": "Imported \($0)", "url": "https://example.com/import/\($0)"] }
        try JSONSerialization.data(withJSONObject: items).write(to: url)
        var firstBatch: CheckedContinuation<Void, Never>?
        var secondBatch: CheckedContinuation<Void, Never>?
        client.beforeImport = {
            if client.importCount == 1 { await withCheckedContinuation { firstBatch = $0 } }
            if client.importCount == 2 { await withCheckedContinuation { secondBatch = $0 } }
        }
        let importing = Task { await rss.importFile(url) }
        try await waitFor { firstBatch != nil }
        let saving = Task { await rss.toggleSaved(self.entry(0)) }
        try await waitFor { !rss.canSave(entry(0)) }
        firstBatch?.resume()
        try await waitFor { secondBatch != nil }
        #expect(rss.canSave(entry(0)))
        #expect(rss.isMutating)
        let saved = try #require(rss.snapshot.unread.first)
        #expect(saved.savedID != nil)
        let removing = Task { await rss.toggleSaved(saved) }
        try await waitFor { !rss.canSave(saved) }
        secondBatch?.resume()
        await importing.value
        await saving.value
        await removing.value
        #expect(client.saveCalls == 1)
        #expect(client.saved.isEmpty)
        #expect(rss.snapshot.saved.isEmpty)
        #expect(client.importCount == 3)
    }

    @Test("A failed queued read is not resent and independent later reads still run")
    func failedQueuedRead() async throws {
        let client = RssTestClient()
        client.unread = [entry(0), entry(1)]
        client.failedReadIDs = ["unread-0"]
        let rss = model(client, container: try container())
        await rss.synchronize()
        var release: CheckedContinuation<Void, Never>?
        client.beforeRead = {
            client.beforeRead = nil
            await withCheckedContinuation { release = $0 }
        }
        let first = Task { await rss.markRead([self.entry(0)]) }
        try await waitFor { release != nil }
        let second = Task { await rss.markRead([self.entry(1)]) }
        for _ in 0..<10 { await Task.yield() }
        release?.resume()
        await first.value
        await second.value
        #expect(client.reads == [["unread-0"], ["unread-1"]])
        #expect(rss.snapshot.unread.map(\.id) == ["unread-0"])
        #expect(rss.errorMessage != nil)
    }

    @Test("A partial bulk read keeps successful batches and stops without resending the failed batch")
    func partialBulkRead() async throws {
        let client = RssTestClient()
        client.unread = (0..<201).map { entry($0) }
        let rss = model(client, container: try container())
        await rss.synchronize()
        let sorted = client.unread.map(\.id).sorted()
        client.failedReadIDs = [sorted[100]]
        await rss.markRead(client.unread)
        #expect(client.reads.count == 2)
        #expect(rss.snapshot.unread.count == 101)
        #expect(rss.errorMessage != nil)
        #expect(Set(rss.snapshot.unread.map(\.id)).isDisjoint(with: Set(sorted.prefix(100))))
    }

    @Test("Snapshot boundaries exclude arrivals during a multi-page download")
    func revisionPinnedDownload() async throws {
        let client = RssTestClient()
        client.unread = (0..<101).map { entry($0) }
        client.beforePage = {
            guard client.requests.count == 3 else { return }
            client.unread.insert(self.entry(999), at: 0)
            client.revision = 1
            client.entryRevisions["unread-999"] = 1
        }
        let rss = model(client, container: try container())
        await rss.synchronize()
        #expect(rss.isComplete)
        #expect(rss.snapshot.unread.count == 101)
        #expect(!rss.snapshot.unread.contains { $0.id == "unread-999" })
        #expect(zip(client.requests, client.requestedRevisions).filter { $0.0.0 == .unread && $0.0.1 > 0 }.allSatisfy { $0.1 == 0 })
    }

    @Test("Cache deletion fences an uncooperative metadata response and remains empty after relaunch")
    func clearDuringDownload() async throws {
        let container = try container()
        let client = RssTestClient()
        client.unread = [entry(0)]
        let rss = model(client, container: container)
        await rss.synchronize()
        var release: CheckedContinuation<Void, Never>?
        client.beforePage = {
            client.beforePage = nil
            await withCheckedContinuation { release = $0 }
        }
        let refresh = Task { await rss.synchronize(manual: true) }
        try await waitFor { release != nil }
        rss.clearCache()
        await rss.restoreCache()
        release?.resume()
        await refresh.value
        #expect(rss.snapshot.unread.isEmpty)
        let restored = model(client, container: container)
        await restored.restoreCache()
        #expect(!restored.isComplete)
    }

    @Test("A browser callback from a signed-out session is rejected after the same owner signs in again")
    func staleSameOwnerCallback() async throws {
        let client = RssTestClient()
        client.unread = [entry(0)]
        let rss = model(client, container: try container())
        await rss.synchronize()
        let previous = rss.sessionID
        let previousIdentity = rss.identityID
        rss.configure(owner: "owner", endpoint: "https://example.com/api/v1", signedIn: false)
        rss.configure(owner: "owner", endpoint: "https://example.com/api/v1", signedIn: true)
        await rss.restoreCache()
        #expect(previousIdentity != rss.identityID)
        await rss.markRead([entry(0)], sessionID: previous)
        #expect(client.reads.isEmpty)
        #expect(rss.snapshot.unread.count == 1)
    }

    @Test("Going offline immediately still restores the full existing cache")
    func offlineDuringRestoration() async throws {
        let container = try container()
        let client = RssTestClient()
        client.unread = [entry(0)]
        let first = model(client, container: container)
        await first.synchronize()
        let restored = model(client, container: container)
        restored.setOnline(false)
        await restored.restoreCache()
        #expect(restored.snapshot.unread.count == 1)
        #expect(restored.isComplete)
        #expect(!restored.canMutate)
    }

    @Test("A mutation committing after reconnect is reconciled automatically without being resent")
    func reconnectDuringRead() async throws {
        let client = RssTestClient()
        client.unread = [entry(0)]
        let rss = model(client, container: try container())
        await rss.synchronize()
        var release: CheckedContinuation<Void, Never>?
        client.beforeRead = {
            client.beforeRead = nil
            await withCheckedContinuation { release = $0 }
        }
        let read = Task { await rss.markRead([self.entry(0)]) }
        try await waitFor { release != nil }
        let identity = rss.identityID
        rss.setOnline(false)
        rss.setOnline(true)
        #expect(identity == rss.identityID)
        await rss.synchronize()
        #expect(rss.snapshot.unread.count == 1)
        release?.resume()
        await read.value
        try await waitFor { client.unread.isEmpty && rss.snapshot.unread.isEmpty }
        #expect(client.reads == [["unread-0"]])
    }

    @Test("A mutation committing after cache deletion cannot trigger a cache refill")
    func clearDuringMutation() async throws {
        let container = try container()
        let client = RssTestClient()
        client.unread = [entry(0)]
        let rss = model(client, container: container)
        await rss.synchronize()
        var release: CheckedContinuation<Void, Never>?
        client.beforeRead = {
            client.beforeRead = nil
            await withCheckedContinuation { release = $0 }
        }
        let read = Task { await rss.markRead([self.entry(0)]) }
        try await waitFor { release != nil }
        rss.clearCache()
        await rss.restoreCache()
        let requests = client.requests.count
        release?.resume()
        await read.value
        try await waitFor { client.unread.isEmpty }
        for _ in 0..<10 { await Task.yield() }
        #expect(client.requests.count == requests)
        #expect(!rss.isComplete)
        let restored = model(client, container: container)
        await restored.restoreCache()
        #expect(!restored.isComplete)
    }

    @Test("Cancelled cache generations cannot write after deletion")
    func cancelledCacheCommit() async throws {
        let cache = RssCacheStore(container: try container())
        let session = RssSession()
        try await cache.save(.init(unread: [entry(0)]), scope: "owner", session: session)
        session.invalidate()
        try await cache.clear()
        try await cache.save(.init(unread: [entry(1)]), scope: "owner", session: session)
        #expect(try await cache.load(scope: "owner") == nil)
    }

    @Test("Large metadata sets keep single-entry actions independent of page count")
    func largeDataset() async throws {
        let client = RssTestClient()
        client.feeds = (0..<100).map { .init(id: "feed-\($0)", url: "https://example.com/feed/\($0)", title: "Feed", lastFetchedAt: .now) }
        client.unread = (0..<10_000).map { entry($0) }
        client.saved = (10_000..<20_000).map { entry($0, saved: true) }
        client.pageDelay = .milliseconds(2)
        let rss = model(client, container: try container())
        let sampler = Task.detached {
            var pauses: [Double] = []
            while !Task.isCancelled {
                do { try await Task.sleep(for: .milliseconds(2)) } catch { break }
                let start = ContinuousClock.now
                await MainActor.run {}
                let duration = start.duration(to: .now)
                pauses.append(Double(duration.components.seconds) + Double(duration.components.attoseconds) / 1e18)
            }
            return pauses.max() ?? 0
        }
        let clock = ContinuousClock()
        let start = clock.now
        await rss.synchronize()
        let loaded = clock.now
        let before = client.requests.count
        await rss.markRead([entry(0)])
        let read = clock.now
        await rss.toggleSaved(entry(1))
        let saved = clock.now
        #expect(rss.isComplete)
        #expect(rss.snapshot.unread.count == 9_999)
        #expect(rss.snapshot.saved.count == 10_001)
        #expect(client.requests.count == before)
        #expect(before == 402)
        sampler.cancel()
        let pause = await sampler.value
        print("RSS_BENCH maxMainActorWait=\(pause)s initial=\(start.duration(to: loaded)) read=\(loaded.duration(to: read)) save=\(read.duration(to: saved)) pageRequests=\(before) mutationPageRequests=\(client.requests.count - before)")
    }

    @Test("Presentation keeps new arrivals separate while filtered pages and deletions change")
    func presentationBoundaries() {
        let snapshot = RssSnapshot(feeds: [.init(id: "feed", url: "https://example.com/feed", title: "News")], unread: [entry(0), entry(1)])
        let shown = RssPresentation(snapshot: snapshot, list: .unread, feedID: "feed", acceptedIDs: ["unread-0"], initialized: true)
        #expect(shown.entries.map(\.id) == ["unread-0"])
        #expect(shown.newCount == 1)
        #expect(shown.sources["feed"] == "News")
        let empty = RssPresentation(snapshot: snapshot, list: .unread, feedID: "other", acceptedIDs: [], initialized: true)
        #expect(empty.entries.isEmpty && empty.newCount == 0)
    }
    @Test("Filter counts include all accepted articles across feeds and exclude unaccepted arrivals")
    func presentationCounts() {
        let unread = (0..<120).map { index in
            RssEntry(id: "item-\(index)", feedID: index < 80 ? "a" : "b", url: "https://example.com/\(index)", title: "Article")
        }
        let snapshot = RssSnapshot(unread: unread)
        let accepted = Set(unread.dropLast().map(\.id))
        let filtered = RssPresentation(snapshot: snapshot, list: .unread, feedID: "b", acceptedIDs: accepted, initialized: true)
        #expect(filtered.unreadCount == 119)
        #expect(filtered.unreadCounts == ["a": 80, "b": 39])
        #expect(filtered.entries.count == 39)
        #expect(filtered.newCount == 1)
        let all = RssPresentation(snapshot: snapshot, list: .unread, feedID: "", acceptedIDs: [], initialized: false)
        #expect(all.unreadCount == 120 && all.entries.count == 120)
        let afterDeletion = RssPresentation(snapshot: .init(unread: unread.filter { $0.feedID == "a" }), list: .unread,
                                            feedID: "b", acceptedIDs: accepted, initialized: true)
        #expect(afterDeletion.entries.isEmpty && afterDeletion.unreadCount == 80)
        #expect(afterDeletion.unreadCounts["b"] == nil)
        let saved = RssPresentation(snapshot: snapshot, list: .saved, feedID: "b", acceptedIDs: accepted, initialized: true)
        #expect(saved.entries.isEmpty && saved.unreadCount == 119)
        let empty = RssPresentation(snapshot: .init(), list: .unread, feedID: "", acceptedIDs: [], initialized: true)
        #expect(empty.unreadCount == 0 && empty.unreadCounts.isEmpty)
    }

}
