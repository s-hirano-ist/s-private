import Foundation
import SwiftData

@MainActor
final class SyncCoordinator: ObservableObject {
    @Published private(set) var pendingCount = 0
    @Published private(set) var lastSyncAt: Date?
    private let context: ModelContext
    private let authentication: AuthenticationModel
    private var syncing = false

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
        old.forEach(context.delete)
        for record in records { context.insert(try CachedMobileRecord(ownerKey: owner, domain: domain, record: record)) }
        try context.save()
        lastSyncAt = Date()
    }

    func cached(domain: MobileDomain) -> [MobileRecord] {
        let owner = authentication.ownerKey
        let domainValue = domain.rawValue
        let descriptor = FetchDescriptor<CachedMobileRecord>(predicate: #Predicate { $0.ownerKey == owner && $0.domainValue == domainValue })
        return (try? context.fetch(descriptor).compactMap { try? MobileAPICoding.decoder().decode(MobileRecord.self, from: $0.recordData) }) ?? []
    }

    func cacheMedia(_ data: Data, domain: MobileDomain, id: String, variant: String) throws {
        let url = try mediaURL(domain: domain, id: id, variant: variant)
        try data.write(to: url, options: .atomic)
    }

    func cachedMedia(domain: MobileDomain, id: String, variant: String) -> Data? {
        guard let url = try? mediaURL(domain: domain, id: id, variant: variant) else { return nil }
        return try? Data(contentsOf: url)
    }

    func pendingOperations() -> [PendingMobileOperation] {
        let owner = authentication.ownerKey
        return (try? context.fetch(FetchDescriptor<PendingMobileOperation>(
            predicate: #Predicate { $0.ownerKey == owner },
            sortBy: [SortDescriptor(\.createdAt)]
        ))) ?? []
    }

    func synchronize() async {
        guard !syncing else { return }
        syncing = true
        defer { syncing = false; refreshCount() }
        let client = MobileClient(authentication: authentication)
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
        lastSyncAt = Date()
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
        try? context.save()
        if let directory = try? mediaDirectory() { try? FileManager.default.removeItem(at: directory) }
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
        try mediaDirectory().appending(path: "\(domain.rawValue)-\(id)-\(variant)")
    }
}
