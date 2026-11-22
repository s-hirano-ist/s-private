@preconcurrency import CoreSpotlight
import Foundation
import UniformTypeIdentifiers

struct SpotlightSnapshotEntry: Codable, Sendable {
    let uniqueIdentifier: String
    let domainIdentifier: String
    let contentTypeIdentifier: String
    let title: String
    let textContent: String
    let contentDescription: String
    let keywords: [String]
    let createdAt: Date
    let modifiedAt: Date
    let contentURL: URL?

    var searchableItem: CSSearchableItem {
        let type = UTType(contentTypeIdentifier) ?? .item
        let attributes = CSSearchableItemAttributeSet(contentType: type)
        attributes.title = title
        attributes.displayName = title
        attributes.textContent = textContent
        attributes.contentDescription = contentDescription
        attributes.keywords = keywords
        attributes.contentCreationDate = createdAt
        attributes.contentModificationDate = modifiedAt
        attributes.contentURL = contentURL
        let item = CSSearchableItem(
            uniqueIdentifier: uniqueIdentifier,
            domainIdentifier: domainIdentifier,
            attributeSet: attributes
        )
        item.expirationDate = .distantFuture
        return item
    }
}

enum SpotlightSnapshotStoreError: Error {
    case appGroupUnavailable
}

enum SpotlightSnapshotStore {
    static let appGroupIdentifier = "group.ist.s-hirano.s-private"
    static let indexName = "MemdexPrivateContent"
    private static let fileName = "spotlight-index-snapshot.json"

    static func read() throws -> [SpotlightSnapshotEntry] {
        let url = try snapshotURL()
        guard FileManager.default.fileExists(atPath: url.path) else { return [] }
        return try JSONDecoder.mobileSnapshot.decode([SpotlightSnapshotEntry].self, from: Data(contentsOf: url))
    }

    static func replace(with entries: [SpotlightSnapshotEntry]) throws {
        let url = try snapshotURL()
        let data = try JSONEncoder.mobileSnapshot.encode(entries)
        try data.write(to: url, options: [.atomic, .completeFileProtection])
    }

    static func upsert(_ entries: [SpotlightSnapshotEntry]) throws {
        guard !entries.isEmpty else { return }
        var values = Dictionary(uniqueKeysWithValues: try read().map { ($0.uniqueIdentifier, $0) })
        entries.forEach { values[$0.uniqueIdentifier] = $0 }
        try replace(with: values.values.sorted { $0.uniqueIdentifier < $1.uniqueIdentifier })
    }

    static func remove(identifiers: [String]) throws {
        let removed = Set(identifiers)
        try replace(with: try read().filter { !removed.contains($0.uniqueIdentifier) })
    }

    static func clear() throws {
        let url = try snapshotURL()
        guard FileManager.default.fileExists(atPath: url.path) else { return }
        try FileManager.default.removeItem(at: url)
    }

    private static func snapshotURL() throws -> URL {
        guard let container = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: appGroupIdentifier
        ) else {
            throw SpotlightSnapshotStoreError.appGroupUnavailable
        }
        return container.appending(path: fileName)
    }
}

final class SpotlightSnapshotIndexDelegate: NSObject, CSSearchableIndexDelegate {
    func searchableIndex(
        _ searchableIndex: CSSearchableIndex,
        reindexAllSearchableItemsWithAcknowledgementHandler acknowledgementHandler: @escaping () -> Void
    ) {
        reindex(entries: (try? SpotlightSnapshotStore.read()) ?? [], acknowledgementHandler: acknowledgementHandler)
    }

    func searchableIndex(
        _ searchableIndex: CSSearchableIndex,
        reindexSearchableItemsWithIdentifiers identifiers: [String],
        acknowledgementHandler: @escaping () -> Void
    ) {
        let requested = Set(identifiers)
        let entries = ((try? SpotlightSnapshotStore.read()) ?? []).filter { requested.contains($0.uniqueIdentifier) }
        reindex(entries: entries, acknowledgementHandler: acknowledgementHandler)
    }

    func searchableItems(
        forIdentifiers identifiers: [String],
        protectionClass: FileProtectionType
    ) async -> [CSSearchableItem] {
        guard protectionClass == .complete else { return [] }
        let requested = Set(identifiers)
        return ((try? SpotlightSnapshotStore.read()) ?? [])
            .filter { requested.contains($0.uniqueIdentifier) }
            .map(\.searchableItem)
    }

    private func reindex(entries: [SpotlightSnapshotEntry], acknowledgementHandler: @escaping () -> Void) {
        let index = CSSearchableIndex(name: SpotlightSnapshotStore.indexName, protectionClass: .complete)
        let acknowledgement = SnapshotAcknowledgement(acknowledgementHandler)
        index.indexSearchableItems(entries.map(\.searchableItem)) { _ in acknowledgement.call() }
    }
}

private final class SnapshotAcknowledgement: @unchecked Sendable {
    private let handler: () -> Void

    init(_ handler: @escaping () -> Void) {
        self.handler = handler
    }

    func call() {
        handler()
    }
}

private extension JSONEncoder {
    static var mobileSnapshot: JSONEncoder {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.sortedKeys]
        return encoder
    }
}

private extension JSONDecoder {
    static var mobileSnapshot: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }
}
