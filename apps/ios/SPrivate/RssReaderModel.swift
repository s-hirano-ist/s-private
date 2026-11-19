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
    private(set) var errorMessage: String?
    private(set) var importSummary: String?
    private(set) var isOnline = true
    private(set) var scope = ""
    private(set) var sessionID = UUID()
    private(set) var identityID = UUID()
    private(set) var dataRevision = 0
    private(set) var pendingKeys: Set<String> = []
    private(set) var isClearingCache = false
    @ObservationIgnored private let cache: RssCacheStore
    @ObservationIgnored private let client: any RssClient
    @ObservationIgnored private let authenticated: () -> Bool
    @ObservationIgnored private var loadingTask: Task<Void, Never>?
    @ObservationIgnored private var metadataTask: Task<Void, Never>?
    @ObservationIgnored private var restorationTask: Task<Void, Never>?
    @ObservationIgnored private var clearTask: Task<Void, Never>?
    @ObservationIgnored private var mutationTask: Task<Void, Never>?
    @ObservationIgnored private var importParsingTask: Task<[RssImportBatch], Error>?
    @ObservationIgnored private var monitor: NWPathMonitor?
    @ObservationIgnored private var session = RssSession()
    @ObservationIgnored private var readVersion = UUID()
    @ObservationIgnored private var metadataFence: RssSession?
    @ObservationIgnored private var lastAttempt: Date?
    @ObservationIgnored private var fixtureMode = false
    @ObservationIgnored private var needsReload = false
    @ObservationIgnored private var cacheDirty = false
    @ObservationIgnored private var pendingReads: Set<String> = []
    @ObservationIgnored private var unreadIDs: Set<String> = []
    @ObservationIgnored private var mutations: [Mutation] = []
    @ObservationIgnored private var allMutations: [UUID: Mutation] = [:]
    @ObservationIgnored private var hasActiveWrite = false

    @ObservationIgnored private var firstPages: Set<RssList> = []
    @ObservationIgnored private var refreshWaiters: [UUID: (RssList, CheckedContinuation<Void, Never>)] = [:]

    private enum Superseded: Error { case read }
    private typealias Work = @MainActor (RssSession) async throws -> Void
    @MainActor
    private final class Mutation {
        let id = UUID()
        let key: String
        let reads: Set<String>
        let bulk: Bool
        let steps: [Work]
        var next = 0
        var succeeded = true
        var continuation: CheckedContinuation<Bool, Never>?
        init(key: String, reads: Set<String>, bulk: Bool, steps: [Work], continuation: CheckedContinuation<Bool, Never>) {
            self.key = key
            self.reads = reads
            self.bulk = bulk
            self.steps = steps
            self.continuation = continuation
        }
        func finish(_ success: Bool) {
            continuation?.resume(returning: success)
            continuation = nil
        }
    }

    init(cache: RssCacheStore, client: any RssClient, authenticated: @escaping () -> Bool = { true }, monitorNetwork: Bool = true) {
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
    deinit { monitor?.cancel() }

    func configure(owner: String, endpoint: String, signedIn: Bool) {
        let next = signedIn ? "\(owner.utf8.count):\(owner):\(endpoint)" : ""
        guard next != scope else { return }
        identityID = UUID()
        invalidateSession()
        scope = next
        snapshot = RssSnapshot()
        isComplete = false
        errorMessage = nil
        importSummary = nil
        changed()
        guard !next.isEmpty else { return }
        restoreCurrentCache()
    }

    private func restoreCurrentCache() {
        let next = scope
        let current = session
        let clearing = clearTask
        restorationTask = Task { [weak self] in
            guard let self else { return }
            await clearing?.value
            do {
                let saved = try await cache.load(scope: next)
                try check(current)
                if let saved { snapshot = saved; isComplete = true; changed() }
            } catch { report(error, session: current) }
        }
    }

    func restoreCache() async { await restorationTask?.value }

    func setOnline(_ online: Bool) {
        guard online != isOnline else { return }
        isOnline = online
        lastAttempt = nil
        if !online {
            invalidateSession()
            if !isComplete && !scope.isEmpty { restoreCurrentCache() }
        }
    }

    // Readers only download DB metadata. The server Cron polls external feeds.
    func synchronize(manual: Bool = false) async {
        await restoreCache()
        await startSynchronization(manual: manual)?.value
    }

    // Pull-to-refresh waits for the first DB page of the selected list, not the offline copy.
    func refresh(_ list: RssList) async {
        await restoreCache()
        guard startSynchronization(manual: true) != nil, !firstPages.contains(list) else { return }
        let id = UUID()
        await withTaskCancellationHandler {
            await withCheckedContinuation { continuation in
                guard !Task.isCancelled else { continuation.resume(); return }
                refreshWaiters[id] = (list, continuation)
            }
        } onCancel: {
            Task { @MainActor [weak self] in self?.refreshWaiters.removeValue(forKey: id)?.1.resume() }
        }
    }

    private func startSynchronization(manual: Bool) -> Task<Void, Never>? {
        guard !fixtureMode, canMutate else { return nil }
        if let loadingTask { return loadingTask }
        guard manual || lastAttempt == nil || Date().timeIntervalSince(lastAttempt!) >= 300 else { return nil }
        lastAttempt = .now
        let current = session
        isLoading = true
        firstPages = []
        if manual { errorMessage = nil }
        let task = Task { [weak self] in
            guard let self else { return }
            await reload(current)
            guard session === current else { return }
            loadingTask = nil
            isLoading = false
            finishRefreshWaiters()
        }
        loadingTask = task
        return task
    }

    private func receivedFirstPage(_ list: RssList) {
        firstPages.insert(list)
        let completed = refreshWaiters.filter { $0.value.0 == list }
        for (id, waiter) in completed {
            refreshWaiters.removeValue(forKey: id)
            waiter.1.resume()
        }
    }

    private func finishRefreshWaiters() {
        let waiters = refreshWaiters.values.map { $0.1 }
        refreshWaiters.removeAll()
        for waiter in waiters { waiter.resume() }
    }

    private var hasPendingWrites: Bool { hasActiveWrite || !mutations.isEmpty }

    // One metadata downloader; mutations fence its results and defer the replacement pass.
    private func reload(_ current: RssSession) async {
        guard session === current, current.isValid else { return }
        needsReload = true
        if let metadataTask { await metadataTask.value; return }
        guard !hasPendingWrites else { return }
        let task = Task { [weak self] in
            guard let self else { return }
            defer { if session === current { metadataTask = nil } }
            while needsReload && !hasPendingWrites && session === current && current.isValid {
                needsReload = false
                let version = readVersion
                do { try await loadAll(current, version: version) }
                catch is Superseded { needsReload = true }
                catch { report(error, session: current) }
            }
        }
        metadataTask = task
        await task.value
    }

    private func loadAll(_ current: RssSession, version: UUID) async throws {
        let fence = RssSession()
        metadataFence = fence
        for attempt in 0..<2 {
            do {
                let firstUnread = try await client.rssPage(.unread, offset: 0, snapshotRevision: nil)
                try checkRead(current, version)
                try validateFirstPage(firstUnread)
                receivedFirstPage(.unread)
                if !isComplete {
                    snapshot.feeds = firstUnread.feeds
                    snapshot.unread = firstUnread.entries
                    changed()
                }
                let firstSaved = try await client.rssPage(.saved, offset: 0, snapshotRevision: nil)
                try checkRead(current, version)
                try validateFirstPage(firstSaved)
                receivedFirstPage(.saved)
                if !isComplete { snapshot.saved = firstSaved.entries; changed() }
                let unread = try await download(.unread, first: firstUnread, session: current, version: version)
                let saved = try await download(.saved, first: firstSaved, session: current, version: version)
                try checkRead(current, version)
                let complete = RssSnapshot(feeds: unread.feeds, unread: unread.entries, saved: saved.entries, fetchedAt: .now)
                try await cache.save(complete, scope: scope, session: fence)
                try checkRead(current, version)
                snapshot = complete
                isComplete = true
                cacheDirty = false
                changed()
                return
            } catch RssError.changingPages { if attempt == 1 { throw RssError.changingPages } }
        }
    }

    private func validateFirstPage(_ page: RssPage) throws {
        guard page.count >= 0, page.count <= 1_000_050, page.offset == 0,
            page.entries.count <= min(50, page.count), Set(page.entries.map(\.id)).count == page.entries.count else { throw RssError.changingPages }
    }

    private func download(_ list: RssList, first: RssPage, session current: RssSession, version: UUID) async throws -> RssPage {
        var entries = first.entries
        var ids = Set(entries.map(\.id))
        var offset = 50
        var lastPublication = ContinuousClock.now
        while entries.count < first.count {
            let page = try await client.rssPage(list, offset: offset, snapshotRevision: list == .unread ? first.snapshotRevision : nil)
            try checkRead(current, version)
            guard page.offset == offset, page.count == first.count, !page.entries.isEmpty, page.entries.count <= 50,
                list != .unread || page.snapshotRevision == first.snapshotRevision else { throw RssError.changingPages }
            for entry in page.entries {
                guard ids.insert(entry.id).inserted else { throw RssError.changingPages }
                entries.append(entry)
            }
            offset += 50
            if !isComplete && (entries.count == 100 || lastPublication.duration(to: .now) >= .milliseconds(250)) {
                if list == .unread { snapshot.unread = entries } else { snapshot.saved = entries }
                changed()
                lastPublication = .now
            }
        }
        let verification = try await client.rssPage(list, offset: 0, snapshotRevision: list == .unread ? first.snapshotRevision : nil)
        try checkRead(current, version)
        guard entries.count == first.count, verification.offset == 0, verification.count == first.count,
            verification.entries == first.entries else { throw RssError.changingPages }
        return .init(feeds: verification.feeds, entries: entries, count: entries.count, snapshotRevision: first.snapshotRevision)
    }

    func markRead(_ entries: [RssEntry], sessionID expected: UUID? = nil) async {
        guard expected == nil || expected == sessionID, canMutate else { return }
        let ids = Set(entries.filter { $0.feedID != nil && (!isComplete || unreadIDs.contains($0.id)) }.map(\.id))
        guard !ids.isEmpty else { return }
        _ = await enqueue(key: "read-\(UUID())", reads: ids, steps: [])
    }

    private func readSteps(_ ids: [String]) -> [Work] {
        stride(from: 0, to: ids.count, by: 100).map { offset in
            let batch = Array(ids[offset..<min(offset + 100, ids.count)])
            return { current in
                try await self.client.rssRead(ids: batch)
                try self.check(current)
                let removed = Set(batch)
                self.snapshot.unread.removeAll { removed.contains($0.id) }
                self.cacheDirty = true
                self.changed()
            }
        }
    }

    func toggleSaved(_ entry: RssEntry, sessionID expected: UUID? = nil) async {
        guard expected == nil || expected == sessionID else { return }
        let shouldSave = entry.savedID == nil
        _ = await enqueue(key: "save:\(entry.url)", steps: [{ current in
            let savedID = self.snapshot.saved.first { $0.url == entry.url }?.id
                ?? self.snapshot.unread.first { $0.url == entry.url }?.savedID ?? entry.savedID
            if shouldSave {
                if let savedID {
                    for index in self.snapshot.unread.indices where self.snapshot.unread[index].url == entry.url {
                        self.snapshot.unread[index].savedID = savedID
                    }
                    self.cacheDirty = true
                    self.changed()
                    return
                }
                let saved = try await self.client.rssSave(entry)
                try self.check(current)
                self.snapshot.saved.removeAll { $0.url == saved.url }
                let insertion = self.snapshot.saved.firstIndex {
                    $0.receivedAt < saved.receivedAt || ($0.receivedAt == saved.receivedAt && $0.id < saved.id)
                } ?? self.snapshot.saved.count
                self.snapshot.saved.insert(saved, at: insertion)
                for index in self.snapshot.unread.indices where self.snapshot.unread[index].url == saved.url {
                    self.snapshot.unread[index].savedID = saved.id
                }
            } else if let savedID {
                try await self.client.rssUnsave(id: savedID)
                try self.check(current)
                self.snapshot.saved.removeAll { $0.id == savedID }
                for index in self.snapshot.unread.indices where self.snapshot.unread[index].url == entry.url {
                    self.snapshot.unread[index].savedID = nil
                }
            }
            self.cacheDirty = true
            self.changed()
        }])
    }

    func subscribe(url: String, title: String, folder: String, sessionID expected: UUID? = nil) async -> Bool {
        guard expected == nil || expected == sessionID else { return false }
        return await enqueue(key: "subscribe:\(url)", steps: [{ current in
            try await self.client.rssSubscribe(url: url, title: title.isEmpty ? url : title, folder: folder)
            try self.check(current)
            self.needsReload = true
            self.lastAttempt = nil
        }])
    }

    func unsubscribe(_ feed: RssFeed, sessionID expected: UUID? = nil) async {
        guard expected == nil || expected == sessionID else { return }
        _ = await enqueue(key: "unsubscribe:\(feed.id)", steps: [{ current in
            try await self.client.rssUnsubscribe(id: feed.id)
            try self.check(current)
            self.snapshot.feeds.removeAll { $0.id == feed.id }
            self.snapshot.unread.removeAll { $0.feedID == feed.id }
            self.cacheDirty = true
            self.changed()
        }])
    }

    func importFile(_ url: URL, sessionID expected: UUID? = nil) async {
        let current = session
        await restoreCache()
        guard session === current, expected == nil || expected == sessionID else { return }
        guard canMutate, !pendingKeys.contains("import") else { return }
        pendingKeys.insert("import")
        importSummary = nil
        let parsing = Task.detached { try RssImport.read(url) }
        importParsingTask = parsing
        do {
            let batches = try await parsing.value
            try check(current)
            importParsingTask = nil
            var added = 0, duplicates = 0, invalid = 0
            let steps: [Work] = batches.map { batch in
                { current in
                    let result = try await self.client.rssImport(batch)
                    try self.check(current)
                    added += result.added; duplicates += result.duplicates; invalid += result.invalid
                    self.importSummary = String(format: String(localized: "追加 %lld件・重複 %lld件・無効 %lld件"), added, duplicates, invalid)
                    self.needsReload = true
                    self.lastAttempt = nil
                }
            }
            // The parsing phase already reserved the import key.
            pendingKeys.remove("import")
            if !steps.isEmpty { _ = await enqueue(key: "import", bulk: true, steps: steps) }
        } catch { report(error, session: current) }
        if session === current { pendingKeys.remove("import"); importParsingTask = nil }
    }

    var canMutate: Bool { !scope.isEmpty && authenticated() && isOnline && !isClearingCache }
    func canSave(_ entry: RssEntry) -> Bool { canMutate && !pendingKeys.contains("save:\(entry.url)") }

    private func enqueue(key: String, reads: Set<String> = [], bulk: Bool = false, steps: [Work]) async -> Bool {
        let current = session
        await restoreCache()
        guard session === current, canMutate, !pendingKeys.contains(key) else { return false }
        let acceptedReads = reads.subtracting(pendingReads)
        guard reads.isEmpty || !acceptedReads.isEmpty else { return false }
        let work = reads.isEmpty ? steps : readSteps(acceptedReads.sorted())
        return await withCheckedContinuation { continuation in
            let mutation = Mutation(key: key, reads: acceptedReads, bulk: bulk || work.count > 1, steps: work, continuation: continuation)
            mutations.append(mutation)
            allMutations[mutation.id] = mutation
            pendingKeys.insert(key)
            pendingReads.formUnion(acceptedReads)
            readVersion = UUID()
            metadataFence?.invalidate()
            if metadataTask != nil || !isComplete { needsReload = true }
            isMutating = true
            errorMessage = nil
            if mutationTask == nil { mutationTask = Task { await self.drain(current) } }
        }
    }

    private func drain(_ current: RssSession) async {
        let owner = identityID
        var finished: [Mutation] = []
        while session === current && current.isValid {
            while !mutations.isEmpty {
                let index = mutations.firstIndex { !$0.bulk } ?? 0
                let mutation = mutations.remove(at: index)
                hasActiveWrite = true
                do {
                    try check(current)
                    try await mutation.steps[mutation.next](current)
                    try check(current)
                    mutation.next += 1
                } catch {
                    mutation.succeeded = false
                    if session === current { needsReload = true; report(error, session: current) }
                }
                guard session === current else {
                    reconcileInvalidatedWrite(owner: owner)
                    return
                }
                hasActiveWrite = false
                if mutation.succeeded && mutation.next < mutation.steps.count { mutations.append(mutation) }
                else {
                    // A completed star action need not wait for an unrelated bulk import.
                    if mutation.key.hasPrefix("save:") { pendingKeys.remove(mutation.key) }
                    finished.append(mutation)
                }
            }
            do { try await persist(current) } catch { report(error, session: current) }
            guard session === current else { return }
            if !mutations.isEmpty { continue }
            if needsReload { await reload(current) }
            guard session === current else { return }
            if mutations.isEmpty { break }
        }
        guard session === current else { return }
        mutationTask = nil
        isMutating = false
        for mutation in finished {
            pendingKeys.remove(mutation.key)
            pendingReads.subtract(mutation.reads)
            allMutations.removeValue(forKey: mutation.id)
            mutation.finish(mutation.succeeded)
        }
    }

    // A request may commit after connectivity cancellation. Re-read only within the same owner/cache lifetime.
    private func reconcileInvalidatedWrite(owner: UUID) {
        guard identityID == owner else { return }
        needsReload = true
        guard canMutate else { return }
        let current = session
        Task { await reload(current) }
    }

    func clearCache() {
        identityID = UUID()
        invalidateSession()
        snapshot = RssSnapshot()
        isComplete = false
        isClearingCache = true
        changed()
        let task = Task { [weak self] in
            guard let self else { return }
            do { try await cache.clear(); await RssThumbnailLoader.shared.clear() } catch { errorMessage = message(error) }
            isClearingCache = false
        }
        clearTask = task
        restorationTask = task
    }

    private func persist(_ current: RssSession) async throws {
        try check(current)
        guard isComplete && cacheDirty else { return }
        let revision = dataRevision
        let value = snapshot
        let requestedScope = scope
        try await cache.save(value, scope: requestedScope, session: current)
        try check(current)
        if dataRevision == revision { cacheDirty = false }
    }
    private func changed() {
        unreadIDs = Set(snapshot.unread.map(\.id))
        dataRevision += 1
    }
    private func message(_ error: Error) -> String? {
        if let error = error as? RssError { return error.localizedDescription }
        return MobileOperationError.message(error)
    }
    private func report(_ error: Error, session current: RssSession) {
        guard session === current, current.isValid, !(error is CancellationError), !(error is Superseded) else { return }
        if let message = message(error) { errorMessage = message }
    }
    private func check(_ current: RssSession) throws {
        try Task.checkCancellation()
        guard session === current, current.isValid, !scope.isEmpty, authenticated() else { throw CancellationError() }
    }
    private func checkRead(_ current: RssSession, _ version: UUID) throws {
        try check(current)
        guard readVersion == version else { throw Superseded.read }
    }
    private func invalidateSession() {
        session.invalidate()
        metadataFence?.invalidate()
        metadataFence = nil
        session = RssSession()
        sessionID = UUID()
        readVersion = UUID()
        loadingTask?.cancel(); loadingTask = nil
        metadataTask?.cancel(); metadataTask = nil
        restorationTask?.cancel(); restorationTask = nil
        mutationTask?.cancel(); mutationTask = nil
        importParsingTask?.cancel(); importParsingTask = nil
        for mutation in allMutations.values { mutation.finish(false) }
        allMutations = [:]; mutations = []; pendingKeys = []; pendingReads = []
        hasActiveWrite = false
        needsReload = false
        cacheDirty = false
        lastAttempt = nil
        isLoading = false
        firstPages = []
        finishRefreshWaiters()
        isMutating = false
    }

    #if DEBUG
    func useFixtures(offline: Bool = false, live: Bool = false) {
        invalidateSession()
        fixtureMode = !live
        isOnline = !offline
        snapshot = RssFixtureClient.snapshot
        isComplete = true
        changed()
    }
    #endif
}
