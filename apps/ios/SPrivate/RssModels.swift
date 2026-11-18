import Foundation
import SPrivateAPI
import SwiftData

// Local metadata models deliberately stay independent of content delta sync.
struct RssFeed: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let url: String
    let title: String
    let folder: String
    let lastFetchedAt: Date?
    let error: String?

    init(_ value: Components.Schemas.RssFeed) {
        id = value.value2.id
        url = value.value1.url
        title = value.value1.title
        folder = value.value1.folder
        lastFetchedAt = value.value2.lastFetchedAt
        error = value.value2.error
    }
    init(id: String, url: String, title: String, folder: String = "", lastFetchedAt: Date? = nil, error: String? = nil)
    {
        self.id = id
        self.url = url
        self.title = title
        self.folder = folder
        self.lastFetchedAt = lastFetchedAt
        self.error = error
    }
    var label: String { folder.isEmpty ? title : "\(folder) / \(title)" }
}

struct RssEntry: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let feedID: String?
    let url: String
    let title: String
    let publishedAt: Date?
    let imageURL: String?
    let receivedAt: Date
    var savedID: String?

    init(
        id: String, feedID: String? = nil, url: String, title: String, publishedAt: Date? = nil,
        imageURL: String? = nil, receivedAt: Date = .now, savedID: String? = nil
    ) {
        self.id = id
        self.feedID = feedID
        self.url = url
        self.title = title
        self.publishedAt = publishedAt
        self.imageURL = imageURL
        self.receivedAt = receivedAt
        self.savedID = savedID
    }
    init(_ value: Components.Schemas.RssUnread) {
        self.init(
            id: value.value2.id, feedID: value.value2.feedId, url: value.value1.url, title: value.value1.title,
            publishedAt: value.value1.publishedAt, imageURL: value.value1.imageUrl, receivedAt: value.value2.receivedAt,
            savedID: value.value2.savedId)
    }
    init(_ value: Components.Schemas.RssSaved) {
        self.init(
            id: value.value2.id, url: value.value1.url, title: value.value1.title,
            publishedAt: value.value1.publishedAt,
            imageURL: value.value1.imageUrl, receivedAt: value.value2.savedAt, savedID: value.value2.id)
    }
    var input: Components.Schemas.RssEntryInput {
        .init(imageUrl: imageURL, url: url, title: title, publishedAt: publishedAt)
    }
    var link: URL? {
        guard let link = URL(string: url), ["http", "https"].contains(link.scheme?.lowercased() ?? ""), link.host != nil
        else { return nil }
        return link
    }
}

struct RssPage: Sendable {
    var feeds: [RssFeed]
    var entries: [RssEntry]
    var count: Int
    var offset: Int = 0
    var snapshotRevision: Int = 0
}

enum RssList: String, CaseIterable, Identifiable, Sendable {
    case unread, saved
    var id: String { rawValue }
    var title: String { self == .unread ? String(localized: "未読") : String(localized: "保存済み") }
}

struct RssSnapshot: Codable, Equatable, Sendable {
    var feeds: [RssFeed] = []
    var unread: [RssEntry] = []
    var saved: [RssEntry] = []
    var fetchedAt: Date?
}

@Model
final class CachedRssSnapshot {
    @Attribute(.unique) var scope: String
    var data: Data
    init(scope: String, data: Data) {
        self.scope = scope
        self.data = data
    }
}

// Shared cancellation fence also guards work already queued on the cache actor.
final class RssSession: @unchecked Sendable {
    private let lock = NSLock()
    private var valid = true
    func invalidate() { lock.withLock { valid = false } }
    var isValid: Bool { lock.withLock { valid } }
}

actor RssCacheStore {
    private let container: ModelContainer
    private var storedContext: ModelContext?
    init(container: ModelContainer) { self.container = container }
    private var context: ModelContext {
        if let storedContext { return storedContext }
        let context = ModelContext(container)
        context.autosaveEnabled = false
        storedContext = context
        return context
    }
    func load(scope: String) throws -> RssSnapshot? {
        let row = try context.fetch(FetchDescriptor<CachedRssSnapshot>(predicate: #Predicate { $0.scope == scope })).first
        return try row.map { try JSONDecoder().decode(RssSnapshot.self, from: $0.data) }
    }
    // Encoding and the atomic generation commit stay off the main actor.
    func save(_ snapshot: RssSnapshot, scope: String, session: RssSession? = nil) throws {
        guard session?.isValid != false else { return }
        let data = try JSONEncoder().encode(snapshot)
        guard session?.isValid != false else { return }
        if let row = try context.fetch(FetchDescriptor<CachedRssSnapshot>(predicate: #Predicate { $0.scope == scope })).first {
            row.data = data
        } else {
            context.insert(CachedRssSnapshot(scope: scope, data: data))
        }
        do { try context.save() } catch { context.rollback(); throw error }
    }
    func clear() throws {
        do {
            try context.delete(model: CachedRssSnapshot.self)
            try context.save()
        } catch { context.rollback(); throw error }
    }
}
