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
    var saved: [RssEntry] = []
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
    var importCount = 0
    var failImportAt: Int?
    func rssPage(_ list: RssList, offset: Int) async throws -> RssPage {
        requests.append((list, offset))
        if let beforePage { await beforePage() }
        if failOffset == offset { throw URLError(.networkConnectionLost) }
        let entries = list == .unread ? unread : saved
        return .init(feeds: feeds, entries: Array(entries.dropFirst(offset).prefix(50)), count: entries.count)
    }
    func rssSubscribe(url: String, title: String, folder: String) async throws {
        feeds.append(.init(id: UUID().uuidString, url: url, title: title, folder: folder, lastFetchedAt: .now))
    }
    func rssUnsubscribe(id: String) async throws {
        feeds.removeAll { $0.id == id }
        unread.removeAll { $0.feedID == id }
    }
    func rssRead(ids: [String]) async throws {
        reads.append(ids)
        if let beforeRead { await beforeRead() }
        if failRead { throw URLError(.networkConnectionLost) }
        unread.removeAll { ids.contains($0.id) }
    }
    func rssSave(_ entry: RssEntry) async throws {
        saved.append(
            .init(
                id: "saved-\(entry.id)", url: entry.url, title: entry.title, imageURL: entry.imageURL,
                savedID: "saved-\(entry.id)"))
    }
    func rssUnsave(id: String) async throws { saved.removeAll { $0.id == id } }
    func rssRefresh(id: String, force: Bool) async throws -> Components.Schemas.RssRefreshResult {
        refreshes += 1
        activeRefreshes += 1
        maxConcurrentRefreshes = max(maxConcurrentRefreshes, activeRefreshes)
        defer { activeRefreshes -= 1 }
        try await Task.sleep(for: .milliseconds(5))
        return .init(data: [.init(id: id, changed: false, status: id == failedFeedID ? .failed : .skipped)])
    }
    func rssImport(_ batch: RssImportBatch) async throws -> Components.Schemas.RssImportResult {
        importCount += 1
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
    func existingStoreMigration() throws {
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
        try cache.save(RssSnapshot(unread: [entry(0)]), scope: "owner-api")
        #expect(try cache.load(scope: "owner-api")?.unread.count == 1)
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
        #expect(model(client, container: container).snapshot == old)
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
        #expect(client.requests.count == 4)
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

    @Test("Feeds use at most five concurrent requests and continue after an individual failure")
    func rollingRefresh() async throws {
        let client = RssTestClient()
        client.feeds = (0..<12).map { .init(id: "feed-\($0)", url: "https://example.com/\($0)", title: "Feed \($0)") }
        client.failedFeedID = "feed-0"
        let rss = model(client, container: try container())
        await rss.synchronize(manual: true)
        #expect(client.refreshes == 12)
        #expect(client.maxConcurrentRefreshes == 5)
        #expect(rss.completedFeeds == 12)
        #expect(rss.errorMessage != nil)
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
        await rss.markRead([entry(1)])
        client.beforeRead = nil
        continuation?.resume()
        await first.value
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
        #expect(!model(client, container: container).snapshot.unread.isEmpty)
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
        #expect(!model(client, container: container).isComplete)
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
