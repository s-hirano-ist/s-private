import Foundation
import Network
import Observation
import SPrivateAPI

@MainActor
@Observable
final class RssReaderModel {
    private(set) var snapshot = RssSnapshot()
    private(set) var isLoading = false
    private(set) var isMutating = false
    private(set) var isComplete = false
    private(set) var completedFeeds = 0
    private(set) var totalFeeds = 0
    private(set) var errorMessage: String?
    private(set) var importSummary: String?
    private(set) var isOnline = true
    private(set) var scope = ""
    private(set) var dataRevision = 0
    @ObservationIgnored private let cache: RssCacheStore
    @ObservationIgnored private let client: any RssClient
    @ObservationIgnored private let authenticated: () -> Bool
    @ObservationIgnored private var loadingTask: Task<Void, Never>?
    @ObservationIgnored private var monitor: NWPathMonitor?
    @ObservationIgnored private var epoch = UUID()
    @ObservationIgnored private var lastAttempt: Date?
    @ObservationIgnored private var fixtureMode = false
    @ObservationIgnored private var queuedReads: [RssEntry] = []

    init(
        cache: RssCacheStore, client: any RssClient, authenticated: @escaping () -> Bool = { true },
        monitorNetwork: Bool = true
    ) {
        self.cache = cache
        self.client = client
        self.authenticated = authenticated
        if monitorNetwork {
            let monitor = NWPathMonitor()
            self.monitor = monitor
            monitor.pathUpdateHandler = { [weak self] path in
                let online = path.status == .satisfied
                Task { @MainActor [weak self] in self?.setOnline(online) }
            }
            monitor.start(queue: DispatchQueue(label: "ist.s-hirano.rss.connectivity"))
        }
    }

    func configure(owner: String, endpoint: String, signedIn: Bool) {
        let next = signedIn ? "\(owner.utf8.count):\(owner):\(endpoint)" : ""
        guard next != scope else { return }
        invalidate()
        scope = next
        snapshot = RssSnapshot()
        isComplete = false
        lastAttempt = nil
        errorMessage = nil
        importSummary = nil
        guard !next.isEmpty else { return }
        do {
            if let saved = try cache.load(scope: next) {
                snapshot = saved
                isComplete = true
            }
        } catch { errorMessage = message(error) }
        dataRevision += 1
    }

    deinit { monitor?.cancel() }

    func setOnline(_ online: Bool) {
        if online && !isOnline { lastAttempt = nil }
        isOnline = online
        if !online { invalidate() }
    }

    func synchronize(manual: Bool = false) async {
        guard !fixtureMode, !scope.isEmpty, authenticated(), isOnline, !isMutating else { return }
        let requestedScope = scope
        if let loadingTask {
            await loadingTask.value
            guard manual, scope == requestedScope else { return }
        }
        guard !scope.isEmpty, authenticated(), isOnline, !isMutating else { return }
        guard manual || lastAttempt == nil || Date().timeIntervalSince(lastAttempt!) >= 300 else { return }
        lastAttempt = Date()
        let token = UUID()
        epoch = token
        isLoading = true
        errorMessage = nil
        completedFeeds = 0
        totalFeeds = 0
        let task = Task<Void, Never> { [weak self] in
            guard let self else { return }
            await self.synchronize(token: token, manual: manual)
        }
        // Keep work alive when navigating to another tab; only explicit invalidation cancels it.
        loadingTask = task
        await loadingTask?.value
        if epoch == token {
            loadingTask = nil
            isLoading = false
        }
    }

    private func synchronize(token: UUID, manual: Bool) async {
        do {
            try await loadAll(token: token)
            let due = snapshot.feeds.filter {
                manual || $0.lastFetchedAt == nil || Date().timeIntervalSince($0.lastFetchedAt!) >= 3600
            }
            totalFeeds = due.count
            if !due.isEmpty {
                let changed = try await refreshFeeds(due, token: token, force: manual)
                try check(token)
                if changed {
                    try await loadAll(token: token)
                } else {
                    // Refresh timestamps and failures are useful even when article metadata did not change.
                    let feeds = try await client.rssPage(.unread, offset: 0).feeds
                    try check(token)
                    snapshot.feeds = feeds
                    try persist()
                }
            }
        } catch is CancellationError {} catch {
            guard epoch == token else { return }
            if (error as? URLError)?.code == .notConnectedToInternet { isOnline = false }
            errorMessage = message(error)
        }
    }

    private func refreshFeeds(_ feeds: [RssFeed], token: UUID, force: Bool) async throws -> Bool {
        let client = client
        return try await withThrowingTaskGroup(of: (Bool, Bool).self) { group in
            var iterator = feeds.makeIterator()
            for _ in 0..<min(5, feeds.count) {
                if let feed = iterator.next() {
                    group.addTask { try await Self.refreshOne(client: client, feed: feed, force: force) }
                }
            }
            var changed = false
            var lastReload = Date.distantPast
            while let result = try await group.next() {
                try check(token)
                completedFeeds += 1
                changed = changed || result.0
                if result.1 { errorMessage = String(localized: "一部のフィードを更新できませんでした") }
                if result.0 && Date().timeIntervalSince(lastReload) >= 1 {
                    do { try await loadAll(token: token) } catch is CancellationError {
                        throw CancellationError()
                    } catch { errorMessage = message(error) }
                    lastReload = Date()
                }
                if let feed = iterator.next() {
                    group.addTask { try await Self.refreshOne(client: client, feed: feed, force: force) }
                }
            }
            return changed
        }
    }

    private static func refreshOne(client: any RssClient, feed: RssFeed, force: Bool) async throws -> (Bool, Bool) {
        do {
            let result = try await client.rssRefresh(id: feed.id, force: force)
            return (result.data.contains { $0.changed == true }, result.data.contains { $0.status == .failed })
        } catch is CancellationError { throw CancellationError() } catch {
            try Task.checkCancellation()
            return (false, true)
        }
    }

    private func loadAll(token: UUID) async throws {
        for attempt in 0..<2 {
            do {
                let unread = try await download(.unread, token: token)
                let saved = try await download(.saved, token: token)
                try check(token)
                var complete = RssSnapshot(
                    feeds: unread.feeds, unread: unread.entries, saved: saved.entries, fetchedAt: .now)
                let stars = Dictionary(saved.entries.map { ($0.url, $0.id) }, uniquingKeysWith: { first, _ in first })
                for index in complete.unread.indices {
                    complete.unread[index].savedID = stars[complete.unread[index].url]
                }
                try cache.save(complete, scope: scope)
                snapshot = complete
                isComplete = true
                dataRevision += 1
                return
            } catch RssError.changingPages {
                if attempt == 1 { throw RssError.changingPages }
            }
        }
    }

    private func download(_ list: RssList, token: UUID) async throws -> RssPage {
        let first = try await client.rssPage(list, offset: 0)
        try check(token)
        guard first.count >= 0, first.count <= 1_000_050 else { throw RssError.changingPages }
        var entries = first.entries
        var ids = Set(entries.map(\.id))
        if !isComplete {
            snapshot.feeds = first.feeds
            if list == .unread { snapshot.unread = first.entries } else { snapshot.saved = first.entries }
        }
        var offset = 50
        while entries.count < first.count {
            let page = try await client.rssPage(list, offset: offset)
            try check(token)
            guard page.count == first.count, !page.entries.isEmpty else { throw RssError.changingPages }
            for entry in page.entries {
                guard ids.insert(entry.id).inserted else { throw RssError.changingPages }
                entries.append(entry)
            }
            offset += 50
        }
        let verification = try await client.rssPage(list, offset: 0)
        try check(token)
        guard ids.count == first.count, entries.count == first.count, verification.count == first.count,
            verification.entries == first.entries
        else { throw RssError.changingPages }
        return RssPage(feeds: verification.feeds, entries: entries, count: entries.count)
    }

    func markRead(_ entries: [RssEntry]) async {
        guard !scope.isEmpty, isOnline, authenticated() else { return }
        if isMutating {
            let existing = Set(queuedReads.map(\.id))
            queuedReads += entries.filter { !existing.contains($0.id) }
            return
        }
        let ids = entries.filter { $0.feedID != nil }.map(\.id)
        guard !ids.isEmpty else { return }
        await mutate { token in
            // Capture IDs before sending; new arrivals can never enter this operation.
            for offset in stride(from: 0, to: ids.count, by: 100) {
                let batch = Array(ids[offset..<min(offset + 100, ids.count)])
                try self.check(token)
                try await self.client.rssRead(ids: batch)
                try self.check(token)
                let removed = Set(batch)
                self.snapshot.unread.removeAll { removed.contains($0.id) }
                try self.persist()
            }
        }
    }

    func toggleSaved(_ entry: RssEntry) async {
        await mutate { token in
            if let savedID = entry.savedID {
                try await self.client.rssUnsave(id: savedID)
                try self.check(token)
                self.snapshot.saved.removeAll { $0.id == savedID }
                for index in self.snapshot.unread.indices where self.snapshot.unread[index].url == entry.url {
                    self.snapshot.unread[index].savedID = nil
                }
                try self.persist()
            } else {
                try await self.client.rssSave(entry)
            }
        }
    }

    func subscribe(url: String, title: String, folder: String) async -> Bool {
        let success = await mutate { _ in
            try await self.client.rssSubscribe(url: url, title: title.isEmpty ? url : title, folder: folder)
        }
        if success {
            lastAttempt = nil
            Task { await synchronize() }
        }
        return success
    }

    func unsubscribe(_ feed: RssFeed) async {
        await mutate { token in
            try await self.client.rssUnsubscribe(id: feed.id)
            try self.check(token)
            self.snapshot.feeds.removeAll { $0.id == feed.id }
            self.snapshot.unread.removeAll { $0.feedID == feed.id }
            try self.persist()
        }
    }

    func importFile(_ url: URL) async {
        guard canMutate else { return }
        importSummary = nil
        let success = await mutate { token in
            let batches = try await Task.detached { try RssImport.read(url) }.value
            try self.check(token)
            var added = 0
            var duplicates = 0
            var invalid = 0
            for batch in batches {
                try self.check(token)
                let result = try await self.client.rssImport(batch)
                try self.check(token)
                added += result.added
                duplicates += result.duplicates
                invalid += result.invalid
                self.importSummary = String(
                    format: String(localized: "追加 %lld件・重複 %lld件・無効 %lld件"), added, duplicates, invalid)
            }
        }
        if success {
            lastAttempt = nil
            Task { await synchronize() }
        }
    }

    var canMutate: Bool { !scope.isEmpty && authenticated() && isOnline && !isMutating }

    @discardableResult
    private func mutate(_ work: (UUID) async throws -> Void) async -> Bool {
        guard canMutate else { return false }
        invalidate()
        let token = epoch
        isMutating = true
        errorMessage = nil
        defer {
            if epoch == token {
                isMutating = false
                let queued = queuedReads
                queuedReads = []
                if !queued.isEmpty {
                    let currentScope = scope
                    Task {
                        guard scope == currentScope else { return }
                        await markRead(queued)
                    }
                }
            }
        }
        var succeeded = false
        do {
            try await work(token)
            try check(token)
            succeeded = true
        } catch is CancellationError { return false } catch { if epoch == token { errorMessage = message(error) } }
        // A lost mutation response is never retried. Reconcile by reading the server.
        guard epoch == token, isOnline, authenticated() else { return succeeded }
        do { try await loadAll(token: token) } catch { if epoch == token { errorMessage = message(error) } }
        return succeeded
    }

    func clearCache() {
        invalidate()
        do {
            try cache.clear()
            snapshot = RssSnapshot()
            isComplete = false
            lastAttempt = nil
            dataRevision += 1
        } catch { errorMessage = message(error) }
    }

    private func message(_ error: Error) -> String? {
        if let error = error as? RssError { return error.localizedDescription }
        return MobileOperationError.message(error)
    }

    private func persist() throws {
        if isComplete { try cache.save(snapshot, scope: scope) }
        dataRevision += 1
    }
    private func check(_ token: UUID) throws {
        try Task.checkCancellation()
        guard epoch == token, !scope.isEmpty, authenticated() else { throw CancellationError() }
    }
    private func invalidate() {
        epoch = UUID()
        queuedReads = []
        loadingTask?.cancel()
        loadingTask = nil
        isLoading = false
        isMutating = false
        completedFeeds = 0
        totalFeeds = 0
    }

    #if DEBUG
        func useFixtures(offline: Bool = false) {
            fixtureMode = true
            isOnline = !offline
            snapshot = RssFixtureClient.snapshot
            isComplete = true
        }
    #endif
}
