import CryptoKit
import Foundation
import SwiftData

@MainActor
final class SyncCoordinator: ObservableObject {
    @Published private(set) var pendingCount = 0
    @Published private(set) var lastSyncAt: Date?
    @Published private(set) var dataRevision = 0
    @Published private(set) var syncError: String?
    private let context: ModelContext
    private let authentication: AuthenticationModel
    private var syncing = false
    private var lastRefreshAttempt: Date?

    init(container: ModelContainer, authentication: AuthenticationModel) {
        context = ModelContext(container)
        self.authentication = authentication
        refreshCount()
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

    func cache(domain: MobileDomain, records: [MobileRecord]) throws {
        let owner = authentication.ownerKey
        let domainValue = domain.rawValue
        let old = try context.fetch(FetchDescriptor<CachedMobileRecord>(predicate: #Predicate { $0.ownerKey == owner && $0.domainValue == domainValue }))
        let byID = Dictionary(uniqueKeysWithValues: old.compactMap { item -> (String, CachedMobileRecord)? in
            guard let id = try? MobileAPICoding.decoder().decode(MobileRecord.self, from: item.recordData).id else { return nil }
            return (id, item)
        })
        for record in records {
            if let item = byID[record.id] {
                item.recordData = try JSONEncoder.mobile.encode(record)
                item.fetchedAt = Date()
            } else {
                context.insert(try CachedMobileRecord(ownerKey: owner, domain: domain, record: record))
            }
        }
        try context.save()
        dataRevision += 1
    }

    func cached(domain: MobileDomain) -> [MobileRecord] {
        let owner = authentication.ownerKey
        let domainValue = domain.rawValue
        let descriptor = FetchDescriptor<CachedMobileRecord>(predicate: #Predicate { $0.ownerKey == owner && $0.domainValue == domainValue })
        return ((try? context.fetch(descriptor).compactMap { try? MobileAPICoding.decoder().decode(MobileRecord.self, from: $0.recordData) }) ?? [])
            .sorted { $0.createdAt == $1.createdAt ? $0.id > $1.id : $0.createdAt > $1.createdAt }
    }

    func cachedRecord(domain: MobileDomain, id: String) -> MobileRecord? {
        cached(domain: domain).first { $0.id == id }
    }

    func cachedCategories() -> [MobileCategory] {
        let owner = authentication.ownerKey
        return ((try? context.fetch(FetchDescriptor<CachedMobileCategory>(predicate: #Predicate { $0.ownerKey == owner }))) ?? [])
            .map { MobileCategory(id: $0.id, name: $0.name) }
            .sorted { $0.name < $1.name }
    }

    func localSearch(_ query: String) -> [MobileSearchResult] {
        let text = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return [] }
        return MobileDomain.allCases.flatMap { domain in
            cached(domain: domain).filter { record in
                [record.title, record.url, record.quote, record.markdown, record.isbn, record.categoryName,
                 record.tags?.joined(separator: " ")].compactMap { $0 }.contains { $0.localizedStandardContains(text) }
            }.map { MobileSearchResult(id: $0.id, type: domain, title: $0.displayTitle, snippet: $0.markdown ?? $0.quote ?? $0.url ?? "") }
        }
    }

    func removeCached(domain: MobileDomain, id: String) {
        let key = "\(authentication.ownerKey):\(domain.rawValue):\(id)"
        if let item = try? context.fetch(FetchDescriptor<CachedMobileRecord>(predicate: #Predicate { $0.cacheKey == key })).first {
            context.delete(item)
            try? context.save()
            dataRevision += 1
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
        guard !syncing else { return }
        syncing = true
        defer { syncing = false; refreshCount() }
        let client = MobileClient(authentication: authentication)
        var createdRecords = false
        for operation in pendingOperations() where operation.ownerKey == authentication.ownerKey && operation.state != .needsAttention {
            operation.state = .sending
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
                operation.retryCount += 1
                operation.state = operation.retryCount >= 3 ? .needsAttention : .pending
                operation.lastError = error.localizedDescription
            }
            try? context.save()
        }
        if force || createdRecords || lastRefreshAttempt.map({ Date().timeIntervalSince($0) >= 300 }) != false {
            lastRefreshAttempt = Date()
            do {
                try await refreshRemote(using: client)
                syncError = nil
                lastSyncAt = Date()
            } catch {
                syncError = error.localizedDescription
                lastRefreshAttempt = nil
            }
        }
    }

    private func refreshRemote(using client: MobileClient) async throws {
        let owner = authentication.ownerKey
        let manifest = try await client.manifest()
        let categoryNames = Dictionary(uniqueKeysWithValues: manifest.categories.map { ($0.id, $0.name) })
        guard authentication.ownerKey == owner else { return }
        for domain in MobileDomain.allCases {
            let remote = manifest.items(for: domain)
            if cached(domain: domain).isEmpty && !remote.isEmpty {
                var offset = 0
                repeat {
                    let page = try await client.list(domain, status: nil, offset: offset, limit: 100)
                    guard authentication.ownerKey == owner else { return }
                    if page.data.isEmpty { break }
                    try cache(domain: domain, records: page.data)
                    offset += page.data.count
                    if offset >= page.totalCount { break }
                } while true
            }
            let local = Dictionary(uniqueKeysWithValues: cached(domain: domain).map { ($0.id, $0) })
            var changed: [MobileRecord] = []
            for item in remote where local[item.id]?.updatedAt != item.updatedAt ||
                (domain == .articles && local[item.id]?.categoryName != categoryNames[local[item.id]?.categoryId ?? ""]) {
                let record = try await client.detail(domain, id: item.id)
                guard authentication.ownerKey == owner else { return }
                if local[item.id] != nil && (domain == .books || domain == .images) {
                    await ThumbnailStore.shared.remove(owner: owner, domain: domain, id: item.id)
                    removeCachedMedia(domain: domain, id: item.id)
                }
                changed.append(record)
            }
            if !changed.isEmpty { try cache(domain: domain, records: changed) }
        }
        guard authentication.ownerKey == owner else { return }
        for domain in MobileDomain.allCases {
            let ids = Set(manifest.items(for: domain).map(\.id))
            for record in cached(domain: domain) where !ids.contains(record.id) {
                removeCached(domain: domain, id: record.id)
                await ThumbnailStore.shared.remove(owner: owner, domain: domain, id: record.id)
                removeCachedMedia(domain: domain, id: record.id)
            }
        }
        let old = try context.fetch(FetchDescriptor<CachedMobileCategory>(predicate: #Predicate { $0.ownerKey == owner }))
        old.forEach(context.delete)
        manifest.categories.forEach { context.insert(CachedMobileCategory(ownerKey: owner, category: $0)) }
        try context.save()
        dataRevision += 1
        for domain in [MobileDomain.books, .images] {
            for item in manifest.items(for: domain) {
                guard authentication.ownerKey == owner else { return }
                if await ThumbnailStore.shared.contains(owner: owner, domain: domain, id: item.id) { continue }
                do {
                    let data = try await client.media(domain, id: item.id, variant: "thumbnail")
                    _ = await ThumbnailStore.shared.saveAndDecode(data, owner: owner, domain: domain, id: item.id, pixelSize: 600)
                } catch {
                    // A missing image does not invalidate the completed metadata sync.
                }
            }
        }
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
        (try? context.fetch(FetchDescriptor<CachedMobileRecord>()))?.forEach(context.delete)
        (try? context.fetch(FetchDescriptor<CachedMobileCategory>()))?.forEach(context.delete)
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
