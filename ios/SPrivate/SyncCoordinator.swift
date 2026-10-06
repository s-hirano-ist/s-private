import CryptoKit
import Foundation
import SwiftData

@MainActor
final class SyncCoordinator: ObservableObject {
    @Published private(set) var pendingCount = 0
    @Published private(set) var lastSyncAt: Date?
    @Published private(set) var dataRevision = 0
    @Published private(set) var syncError: String?
    @Published private(set) var isRefreshing = false
    @Published private(set) var isSynchronizing = false
    private let context: ModelContext
    private let authentication: AuthenticationModel
    private let makeClient: @MainActor () -> any MobileSyncClient
    private var synchronizationTask: Task<Void, Never>?
    private var forceAfterCurrentSync = false
    private var lastRefreshAttempt: Date?
    private var thumbnailTask: Task<Void, Never>?

    init(container: ModelContainer, authentication: AuthenticationModel, clientFactory: (@MainActor () -> any MobileSyncClient)? = nil) {
        context = ModelContext(container)
        self.authentication = authentication
        makeClient = clientFactory ?? { MobileClient(authentication: authentication) }
        refreshCount()
        Task { await migrateLegacyMetadata() }
    }

    func enqueue(domain: MobileDomain, input: MobileCreate, attachment: Data? = nil) throws {
        var path: String?
        if let attachment {
            let directory = try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
                .appending(path: "PendingAttachments", directoryHint: .isDirectory)
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            let url = directory.appending(path: "\(input.operationId.uuidString).jpg")
            try attachment.write(to: url, options: .atomic)
            path = url.path
        }
        context.insert(PendingMobileOperation(operationID: input.operationId, ownerKey: authentication.ownerKey, domain: domain, payload: try JSONEncoder().encode(input), attachmentPath: path))
        try context.save()
        refreshCount()
    }

    func importSharedInbox() {
        do {
            let store = try SharedInboxStore()
            let imported = try store.importPending()
            for item in imported where !pendingOperations().contains(where: { $0.operationID == item.operationID }) {
                let domain: MobileDomain = item.kind == .url ? .articles : item.kind == .image ? .images : .notes
                let input = MobileCreate(
                    operationId: item.operationID,
                    title: item.title ?? item.text?.prefix(64).description ?? String(localized: "共有項目"),
                    url: item.kind == .url ? item.text : nil,
                    category: item.kind == .url ? (item.category ?? String(localized: "共有")) : nil,
                    markdown: item.kind == .text ? item.text : nil
                )
                try enqueue(domain: domain, input: input, attachment: try store.attachmentData(for: item))
            }
        } catch { /* The settings screen reports App Group failures. */ }
    }

    func cache(domain: MobileDomain, records: [MobileRecord], generation: String? = nil, publishRevision: Bool = true) throws {
        guard !records.isEmpty else { return }
        let owner = authentication.ownerKey
        let domainValue = domain.rawValue
        let keys = records.map { "\(owner):\(domainValue):\($0.id)" }
        let old = try context.fetch(FetchDescriptor<CachedMobileRecord>(predicate: #Predicate {
            $0.ownerKey == owner && $0.domainValue == domainValue && keys.contains($0.cacheKey)
        }))
        let byKey = Dictionary(uniqueKeysWithValues: old.map { ($0.cacheKey, $0) })
        for record in records {
            let key = "\(owner):\(domain.rawValue):\(record.id)"
            if let item = byKey[key] {
                try item.update(record, generation: generation)
            } else {
                let item = try CachedMobileRecord(ownerKey: owner, domain: domain, record: record)
                item.syncGeneration = generation
                context.insert(item)
            }
        }
        try context.save()
        if publishRevision { dataRevision += 1 }
    }

    func cached(domain: MobileDomain) -> [MobileRecord] {
        let owner = authentication.ownerKey
        let domainValue = domain.rawValue
        let descriptor = FetchDescriptor<CachedMobileRecord>(predicate: #Predicate { $0.ownerKey == owner && $0.domainValue == domainValue })
        return ((try? context.fetch(descriptor).compactMap { try? MobileAPICoding.decoder().decode(MobileRecord.self, from: $0.recordData) }) ?? [])
            .sorted { $0.createdAt == $1.createdAt ? $0.id > $1.id : $0.createdAt > $1.createdAt }
    }

    func cachedPage(domain: MobileDomain, status: MobileContentStatus?, offset: Int, limit: Int = 30) -> (records: [MobileRecord], hasMore: Bool) {
        let owner = authentication.ownerKey
        let domainValue = domain.rawValue
        let statusValue = status?.rawValue
        var descriptor = FetchDescriptor<CachedMobileRecord>(
            predicate: #Predicate { $0.ownerKey == owner && $0.domainValue == domainValue && (statusValue == nil || $0.statusValue == statusValue) },
            sortBy: [SortDescriptor(\.createdAt, order: .reverse), SortDescriptor(\.recordID, order: .reverse)]
        )
        descriptor.fetchOffset = offset
        descriptor.fetchLimit = limit + 1
        let rows = (try? context.fetch(descriptor)) ?? []
        let categories = Dictionary(uniqueKeysWithValues: cachedCategories().map { ($0.id, $0.name) })
        let records = rows.prefix(limit).compactMap { item -> MobileRecord? in
            guard var record = try? MobileAPICoding.decoder().decode(MobileRecord.self, from: item.recordData) else { return nil }
            if let categoryId = record.categoryId { record.categoryName = categories[categoryId] }
            return record
        }
        return (records, rows.count > limit)
    }

    func cachedRecord(domain: MobileDomain, id: String) -> MobileRecord? {
        let key = "\(authentication.ownerKey):\(domain.rawValue):\(id)"
        guard let item = try? context.fetch(FetchDescriptor<CachedMobileRecord>(predicate: #Predicate { $0.cacheKey == key })).first,
              var record = try? MobileAPICoding.decoder().decode(MobileRecord.self, from: item.recordData) else { return nil }
        if let categoryId = record.categoryId {
            record.categoryName = cachedCategories().first { $0.id == categoryId }?.name
        }
        return record
    }

    private func migrateLegacyMetadata() async {
        while !Task.isCancelled {
            var descriptor = FetchDescriptor<CachedMobileRecord>(predicate: #Predicate { $0.recordID == nil || $0.searchText == nil })
            descriptor.fetchLimit = 100
            guard let rows = try? context.fetch(descriptor), !rows.isEmpty else { return }
            for item in rows {
                if let record = try? MobileAPICoding.decoder().decode(MobileRecord.self, from: item.recordData) {
                    try? item.update(record)
                } else {
                    context.delete(item)
                }
            }
            try? context.save()
            dataRevision += 1
            await Task.yield()
        }
    }

    func cachedCategories() -> [MobileCategory] {
        let owner = authentication.ownerKey
        return ((try? context.fetch(FetchDescriptor<CachedMobileCategory>(predicate: #Predicate { $0.ownerKey == owner }))) ?? [])
            .map { MobileCategory(id: $0.id, name: $0.name) }
            .sorted { $0.name < $1.name }
    }

    func localSearch(_ query: String) -> [MobileSearchResult] {
        let text = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !text.isEmpty else { return [] }
        let owner = authentication.ownerKey
        return MobileDomain.allCases.flatMap { domain -> [MobileSearchResult] in
            let domainValue = domain.rawValue
            var descriptor = FetchDescriptor<CachedMobileRecord>(predicate: #Predicate {
                $0.ownerKey == owner && $0.domainValue == domainValue && ($0.searchText?.contains(text) == true)
            })
            descriptor.fetchLimit = 100
            let rows: [CachedMobileRecord] = (try? context.fetch(descriptor)) ?? []
            return rows.compactMap { item -> MobileSearchResult? in
                guard let record = try? MobileAPICoding.decoder().decode(MobileRecord.self, from: item.recordData) else { return nil }
                return MobileSearchResult(id: record.id, type: domain, title: record.displayTitle, snippet: record.markdown ?? record.quote ?? record.url ?? "")
            }
        }
    }

    func removeCached(domain: MobileDomain, id: String, publishRevision: Bool = true) {
        let key = "\(authentication.ownerKey):\(domain.rawValue):\(id)"
        if let item = try? context.fetch(FetchDescriptor<CachedMobileRecord>(predicate: #Predicate { $0.cacheKey == key })).first {
            context.delete(item)
            try? context.save()
            if publishRevision { dataRevision += 1 }
        }
    }

    func cacheMedia(_ data: Data, domain: MobileDomain, id: String, variant: String) throws {
        let url = try mediaURL(domain: domain, id: id, variant: variant)
        try data.write(to: url, options: .atomic)
    }

    func cachedMedia(domain: MobileDomain, id: String, variant: String) -> Data? {
        guard let url = try? mediaURL(domain: domain, id: id, variant: variant) else { return nil }
        return try? Data(contentsOf: url)
    }

    private func removeCachedMedia(domain: MobileDomain, id: String) {
        if let url = try? mediaURL(domain: domain, id: id, variant: "original") {
            try? FileManager.default.removeItem(at: url)
        }
    }

    func pendingOperations() -> [PendingMobileOperation] {
        let owner = authentication.ownerKey
        return (try? context.fetch(FetchDescriptor<PendingMobileOperation>(
            predicate: #Predicate { $0.ownerKey == owner },
            sortBy: [SortDescriptor(\.createdAt)]
        ))) ?? []
    }

    func synchronize(force: Bool = false) async {
        if let synchronizationTask {
            if force { forceAfterCurrentSync = true }
            await synchronizationTask.value
            return
        }
        let task = Task { @MainActor in
            isSynchronizing = true
            await performSynchronization(force: force)
            while forceAfterCurrentSync {
                forceAfterCurrentSync = false
                await performSynchronization(force: true)
            }
            isSynchronizing = false
            synchronizationTask = nil
            refreshCount()
        }
        synchronizationTask = task
        await task.value
    }

    private func performSynchronization(force: Bool) async {
        let client = makeClient()
        var createdRecords = false
        for operation in pendingOperations() where operation.ownerKey == authentication.ownerKey && operation.state != .needsAttention {
            operation.state = .sending
            operation.lastError = nil
            try? context.save()
            do {
                let input = try JSONDecoder().decode(MobileCreate.self, from: operation.payload)
                if let path = operation.attachmentPath {
                    try await client.chunkedUpload(operation.domain, operationId: operation.operationID, image: Data(contentsOf: URL(filePath: path)), fields: input.uploadFields)
                } else {
                    try await client.create(operation.domain, input: input)
                }
                if let path = operation.attachmentPath { try? FileManager.default.removeItem(atPath: path) }
                context.delete(operation)
                createdRecords = true
            } catch MobileClientError.authenticationRequired {
                operation.state = .authenticationRequired
                operation.lastError = String(localized: "ログインが必要です")
            } catch let MobileClientError.http(status, code) where status == 401 {
                operation.state = .authenticationRequired
                operation.lastError = code
            } catch let MobileClientError.http(status, code) where status == 409 || status == 422 {
                operation.state = .needsAttention
                operation.lastError = code
            } catch {
                if MobileOperationError.isCancellation(error, taskIsCancelled: Task.isCancelled) {
                    operation.state = .pending
                    operation.lastError = nil
                } else {
                    operation.retryCount += 1
                    operation.state = operation.retryCount >= 3 ? .needsAttention : .pending
                    operation.lastError = MobileOperationError.message(error)
                }
            }
            try? context.save()
        }
        if force || createdRecords || lastRefreshAttempt.map({ Date().timeIntervalSince($0) >= 300 }) != false {
            lastRefreshAttempt = Date()
            syncError = nil
            do {
                try await refreshRemote(using: client)
                lastSyncAt = Date()
                thumbnailTask?.cancel()
                let owner = authentication.ownerKey
                thumbnailTask = Task { await warmThumbnails(using: client, owner: owner) }
            } catch {
                syncError = Self.syncErrorMessage(for: error, taskIsCancelled: Task.isCancelled)
                lastRefreshAttempt = nil
            }
        }
    }

    static func syncErrorMessage(for error: Error, taskIsCancelled: Bool = false) -> String? {
        if MobileOperationError.isCancellation(error, taskIsCancelled: taskIsCancelled) {
            return nil
        }
        if case MobileClientError.authenticationRequired = error {
            return String(localized: "ログインしてから再試行してください")
        }
        if case let MobileClientError.http(status, _) = error, status == 401 {
            return String(localized: "ログインしてから再試行してください")
        }
        if let urlError = error as? URLError,
            [.notConnectedToInternet, .networkConnectionLost, .timedOut, .cannotConnectToHost, .cannotFindHost].contains(urlError.code) {
            return String(localized: "通信環境を確認し、下に引いて再試行してください")
        }
        return String(localized: "同期できませんでした。しばらくしてから下に引いて再試行してください")
    }

    private func warmThumbnails(using client: any MobileSyncClient, owner: String) async {
        for domain in [MobileDomain.books, .images] {
            var offset = 0
            let domainValue = domain.rawValue
            while !Task.isCancelled && authentication.ownerKey == owner {
                var descriptor = FetchDescriptor<CachedMobileRecord>(
                    predicate: #Predicate { $0.ownerKey == owner && $0.domainValue == domainValue },
                    sortBy: [SortDescriptor(\.cacheKey)]
                )
                descriptor.fetchOffset = offset
                descriptor.fetchLimit = 30
                guard let rows = try? context.fetch(descriptor), !rows.isEmpty else { break }
                for item in rows {
                    guard !Task.isCancelled, authentication.ownerKey == owner else { return }
                    guard let id = item.recordID, !(await ThumbnailStore.shared.contains(owner: owner, domain: domain, id: id)) else { continue }
                    do {
                        let data = try await client.media(domain, id: id, variant: "thumbnail")
                        guard !Task.isCancelled, authentication.ownerKey == owner else { return }
                        await ThumbnailStore.shared.save(data, owner: owner, domain: domain, id: id)
                    } catch {
                        // Failed media fetches retry during a later sync.
                    }
                }
                offset += rows.count
                await Task.yield()
            }
        }
    }

    private func refreshRemote(using client: any MobileSyncClient) async throws {
        let owner = authentication.ownerKey
        isRefreshing = true
        defer { isRefreshing = false }
        let state = try syncState(for: owner)
        if state.cursor == nil {
            let head = try await client.syncHead()
            let generation = UUID().uuidString
            for domain in MobileDomain.allCases {
                var after = ""
                repeat {
                    let page = try await client.snapshot(domain.rawValue, after: after)
                    guard authentication.ownerKey == owner else { return }
                    try cache(domain: domain, records: page.data, generation: generation, publishRevision: false)
                    guard let next = page.nextAfter else { break }
                    after = next
                } while true
            }
            var after = ""
            repeat {
                let page = try await client.categorySnapshot(after: after)
                guard authentication.ownerKey == owner else { return }
                for category in page.data { try upsertCategory(category, owner: owner, generation: generation) }
                try context.save()
                guard let next = page.nextAfter else { break }
                after = next
            } while true
            try await pruneSnapshot(owner: owner, generation: generation)
            state.cursor = head
            try context.save()
            dataRevision += 1
        }
        guard var cursor = state.cursor else { return }
        repeat {
            let page = try await client.changes(cursor: cursor)
            guard authentication.ownerKey == owner else { return }
            try await applyChanges(page.data, owner: owner)
            state.cursor = page.nextCursor
            try context.save()
            cursor = page.nextCursor
            if !page.hasMore { break }
        } while true
    }

    private func syncState(for owner: String) throws -> MobileSyncState {
        if let state = try context.fetch(FetchDescriptor<MobileSyncState>(predicate: #Predicate { $0.ownerKey == owner })).first {
            return state
        }
        let state = MobileSyncState(ownerKey: owner)
        context.insert(state)
        try context.save()
        return state
    }

    private func upsertCategory(_ category: MobileCategory, owner: String, generation: String? = nil) throws {
        let key = "\(owner):category:\(category.id)"
        if let item = try context.fetch(FetchDescriptor<CachedMobileCategory>(predicate: #Predicate { $0.cacheKey == key })).first {
            item.name = category.name
            if let generation { item.syncGeneration = generation }
        } else {
            let item = CachedMobileCategory(ownerKey: owner, category: category)
            item.syncGeneration = generation
            context.insert(item)
        }
    }

    private func pruneSnapshot(owner: String, generation: String) async throws {
        while true {
            var descriptor = FetchDescriptor<CachedMobileRecord>(predicate: #Predicate {
                $0.ownerKey == owner && $0.syncGeneration != generation
            })
            descriptor.fetchLimit = 100
            let stale = try context.fetch(descriptor)
            if stale.isEmpty { break }
            for item in stale {
                if let domain = MobileDomain(rawValue: item.domainValue), let id = item.recordID {
                    await ThumbnailStore.shared.remove(owner: owner, domain: domain, id: id)
                    removeCachedMedia(domain: domain, id: id)
                }
                context.delete(item)
            }
            try context.save()
            await Task.yield()
        }
        while true {
            var descriptor = FetchDescriptor<CachedMobileCategory>(predicate: #Predicate {
                $0.ownerKey == owner && $0.syncGeneration != generation
            })
            descriptor.fetchLimit = 100
            let stale = try context.fetch(descriptor)
            if stale.isEmpty { break }
            stale.forEach(context.delete)
            try context.save()
        }
    }

    func applyChanges(_ changes: [MobileSyncChange], owner: String) async throws {
        for change in changes {
            if change.domain == "categories" {
                if change.action == "delete" {
                    let key = "\(owner):category:\(change.id)"
                    if let item = try context.fetch(FetchDescriptor<CachedMobileCategory>(predicate: #Predicate { $0.cacheKey == key })).first {
                        context.delete(item)
                    }
                } else if let category = change.category {
                    try upsertCategory(category, owner: owner)
                } else { throw MobileClientError.invalidResponse }
                continue
            }
            guard let domain = MobileDomain(rawValue: change.domain) else { throw MobileClientError.invalidResponse }
            if change.action == "delete" {
                removeCached(domain: domain, id: change.id, publishRevision: false)
                await ThumbnailStore.shared.remove(owner: owner, domain: domain, id: change.id)
                removeCachedMedia(domain: domain, id: change.id)
            } else if let record = change.record {
                if domain == .images || domain == .books {
                    await ThumbnailStore.shared.remove(owner: owner, domain: domain, id: change.id)
                    removeCachedMedia(domain: domain, id: change.id)
                }
                try cache(domain: domain, records: [record], publishRevision: false)
            } else { throw MobileClientError.invalidResponse }
        }
        if !changes.isEmpty { dataRevision += 1 }
    }

    func retry(_ operation: PendingMobileOperation) async {
        operation.state = .pending
        operation.retryCount = 0
        try? context.save()
        await synchronize()
    }

    func revise(_ operation: PendingMobileOperation, input: MobileCreate) throws {
        operation.operationID = input.operationId
        operation.payload = try JSONEncoder().encode(input)
        operation.state = .pending
        operation.retryCount = 0
        operation.lastError = nil
        try context.save()
        refreshCount()
    }

    func cancel(_ operation: PendingMobileOperation) {
        if let path = operation.attachmentPath { try? FileManager.default.removeItem(atPath: path) }
        context.delete(operation)
        try? context.save()
        refreshCount()
    }

    func clearCache() {
        thumbnailTask?.cancel()
        thumbnailTask = nil
        (try? context.fetch(FetchDescriptor<CachedMobileRecord>()))?.forEach(context.delete)
        (try? context.fetch(FetchDescriptor<CachedMobileCategory>()))?.forEach(context.delete)
        (try? context.fetch(FetchDescriptor<MobileSyncState>()))?.forEach(context.delete)
        try? context.save()
        dataRevision += 1
        if let directory = try? mediaDirectory() { try? FileManager.default.removeItem(at: directory) }
        Task { await ThumbnailStore.shared.clearDisk() }
    }

    func discardPending() {
        for operation in pendingOperations() { cancel(operation) }
    }

    private func refreshCount() {
        let owner = authentication.ownerKey
        pendingCount = (try? context.fetchCount(FetchDescriptor<PendingMobileOperation>(predicate: #Predicate { $0.ownerKey == owner }))) ?? 0
    }

    private func mediaDirectory() throws -> URL {
        let directory = try FileManager.default.url(for: .cachesDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
            .appending(path: "MobileMedia", directoryHint: .isDirectory)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        return directory
    }

    private func mediaURL(domain: MobileDomain, id: String, variant: String) throws -> URL {
        let key = "\(authentication.ownerKey):\(domain.rawValue):\(id):\(variant)"
        let digest = SHA256.hash(data: Data(key.utf8)).map { String(format: "%02x", $0) }.joined()
        return try mediaDirectory().appending(path: digest)
    }
}
