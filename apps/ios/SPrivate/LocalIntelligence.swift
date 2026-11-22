import CoreSpotlight
import CryptoKit
import Foundation
import FoundationModels
import SwiftData
import UniformTypeIdentifiers

enum LocalIntelligenceError: LocalizedError {
    case disabled
    case modelUnavailable

    var errorDescription: String? {
        switch self {
        case .disabled:
            String(localized: "ローカルAI検索を設定で有効にしてください")
        case .modelUnavailable:
            String(localized: "Apple Intelligenceをこの端末で利用できません")
        }
    }
}

struct LocalIndexIdentity: Equatable, Sendable {
    static let separator = "|"

    let ownerDigest: String
    let domain: MobileDomain
    let recordID: String

    var uniqueIdentifier: String {
        [ownerDigest, domain.rawValue, recordID].joined(separator: Self.separator)
    }

    init(owner: String, domain: MobileDomain, recordID: String) {
        ownerDigest = Self.digest(owner)
        self.domain = domain
        self.recordID = recordID
    }

    init?(uniqueIdentifier: String) {
        let parts = uniqueIdentifier.split(separator: Character(Self.separator), maxSplits: 2).map(String.init)
        guard parts.count == 3, let domain = MobileDomain(rawValue: parts[1]) else { return nil }
        ownerDigest = parts[0]
        self.domain = domain
        recordID = parts[2]
    }

    static func digest(_ owner: String) -> String {
        SHA256.hash(data: Data(owner.utf8)).prefix(16).map { String(format: "%02x", $0) }.joined()
    }
}

@MainActor
final class LocalIntelligenceCoordinator: ObservableObject, @unchecked Sendable {
    @Published private(set) var isEnabled: Bool
    @Published private(set) var isIndexing = false
    @Published private(set) var indexError: String?

    private static let indexName = SpotlightSnapshotStore.indexName
    private static let defaultsPrefix = "LocalIntelligenceEnabled."
    private let context: ModelContext
    private let authentication: AuthenticationModel
    private let searchableIndex: CSSearchableIndex
    private let indexDelegate: SpotlightSnapshotIndexDelegate
    private var activeOwnerDigest: String
    private var indexTask: Task<Void, Never>?

    init(container: ModelContainer, authentication: AuthenticationModel) {
        context = ModelContext(container)
        self.authentication = authentication
        let indexDelegate = SpotlightSnapshotIndexDelegate()
        self.indexDelegate = indexDelegate
        searchableIndex = CSSearchableIndex(name: Self.indexName, protectionClass: .complete)
        searchableIndex.indexDelegate = indexDelegate
        activeOwnerDigest = LocalIndexIdentity.digest(authentication.ownerKey)
        isEnabled = UserDefaults.standard.bool(forKey: Self.defaultsKey(owner: authentication.ownerKey))
        CSUserQuery.prepareProtectionClasses([.complete])
    }

    deinit {
        indexTask?.cancel()
    }

    var canAnswerWithAppleIntelligence: Bool {
        guard isEnabled else { return false }
        if case .available = SystemLanguageModel.default.availability { return true }
        return false
    }

    func setEnabled(_ enabled: Bool) async {
        UserDefaults.standard.set(enabled, forKey: Self.defaultsKey(owner: authentication.ownerKey))
        isEnabled = enabled
        if enabled {
            await rebuildIndex()
        } else {
            await purgeIndex()
        }
    }

    func activateCurrentOwner() async {
        let digest = LocalIndexIdentity.digest(authentication.ownerKey)
        guard digest != activeOwnerDigest else {
            isEnabled = UserDefaults.standard.bool(forKey: Self.defaultsKey(owner: authentication.ownerKey))
            if isEnabled { await rebuildIndex() }
            return
        }
        await purgeIndex()
        activeOwnerDigest = digest
        isEnabled = UserDefaults.standard.bool(forKey: Self.defaultsKey(owner: authentication.ownerKey))
        if isEnabled { await rebuildIndex() }
    }

    func prepareForSignOut() async {
        await purgeIndex()
    }

    func didUpsert(owner: String, domain: MobileDomain, records: [MobileRecord]) {
        guard isEnabled, LocalIndexIdentity.digest(owner) == activeOwnerDigest, !records.isEmpty else { return }
        scheduleIndexing { [searchableIndex] in
            let entries = records.map { Self.snapshotEntry(owner: owner, domain: domain, record: $0) }
            try SpotlightSnapshotStore.upsert(entries)
            try await searchableIndex.indexSearchableItems(entries.map(\.searchableItem))
        }
    }

    func didDelete(owner: String, domain: MobileDomain, recordID: String) {
        guard LocalIndexIdentity.digest(owner) == activeOwnerDigest else { return }
        let identifier = LocalIndexIdentity(owner: owner, domain: domain, recordID: recordID).uniqueIdentifier
        scheduleIndexing { [searchableIndex] in
            try SpotlightSnapshotStore.remove(identifiers: [identifier])
            try await searchableIndex.deleteSearchableItems(withIdentifiers: [identifier])
        }
    }

    func rebuildIndex() async {
        guard isEnabled else { return }
        await indexTask?.value
        indexTask = nil
        isIndexing = true
        indexError = nil
        defer { isIndexing = false }
        do {
            try await searchableIndex.deleteAllSearchableItems()
            let owner = authentication.ownerKey
            let rows = try context.fetch(FetchDescriptor<CachedMobileRecord>(predicate: #Predicate { $0.ownerKey == owner }))
            let entries = rows.compactMap { row -> SpotlightSnapshotEntry? in
                guard let domain = MobileDomain(rawValue: row.domainValue),
                      let record = try? MobileAPICoding.decoder().decode(MobileRecord.self, from: row.recordData)
                else { return nil }
                return Self.snapshotEntry(owner: owner, domain: domain, record: record)
            }
            try SpotlightSnapshotStore.replace(with: entries)
            for batchStart in stride(from: 0, to: entries.count, by: 100) {
                try Task.checkCancellation()
                let items = entries[batchStart..<min(batchStart + 100, entries.count)].map(\.searchableItem)
                try await searchableIndex.indexSearchableItems(items)
            }
        } catch is CancellationError {
            return
        } catch {
            indexError = error.localizedDescription
        }
    }

    func purgeIndex() async {
        await indexTask?.value
        indexTask = nil
        do {
            try await searchableIndex.deleteAllSearchableItems()
            try SpotlightSnapshotStore.clear()
            indexError = nil
        } catch {
            indexError = error.localizedDescription
        }
    }

    func search(_ query: String, limit: Int = 100) async throws -> [MobileSearchResult] {
        guard isEnabled else { throw LocalIntelligenceError.disabled }
        let submitted = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !submitted.isEmpty else { return [] }
        let queryContext = CSUserQueryContext()
        queryContext.enableRankedResults = true
        queryContext.disableSemanticSearch = false
        queryContext.maxResultCount = limit
        queryContext.maxRankedResultCount = limit
        queryContext.fetchAttributes = [
            "title",
            "textContent",
            "contentDescription",
        ]
        let spotlightQuery = CSUserQuery(userQueryString: submitted, userQueryContext: queryContext)
        spotlightQuery.protectionClasses = [.complete]
        var results: [MobileSearchResult] = []
        for try await response in spotlightQuery.responses {
            guard case let .item(match) = response,
                  let identity = LocalIndexIdentity(uniqueIdentifier: match.item.uniqueIdentifier),
                  identity.ownerDigest == activeOwnerDigest
            else { continue }
            let attributes = match.item.attributeSet
            results.append(MobileSearchResult(
                id: identity.recordID,
                type: identity.domain,
                title: attributes.title ?? identity.domain.title,
                snippet: attributes.contentDescription ?? attributes.textContent ?? ""
            ))
            if results.count >= limit { break }
        }
        return results
    }

    func answerStream(question: String) throws -> AsyncThrowingStream<String, Error> {
        guard isEnabled else { throw LocalIntelligenceError.disabled }
        guard case .available = SystemLanguageModel.default.availability else {
            throw LocalIntelligenceError.modelUnavailable
        }
        var source = CoreSpotlightSource(
            searchableIndexDelegate: indexDelegate,
            fetchAttributes: [.title, .textContent, .contentDescription, .keywords, .contentURL]
        )
        source.maximumResultCount = 30
        let tool = SpotlightSearchTool(configuration: .init(
            sources: [.coreSpotlight(source)],
            guide: .focused()
        ))
        let session = LanguageModelSession(
            model: .default,
            tools: [tool],
            instructions: "Memdexに保存されたユーザー自身のコンテンツだけを根拠に、日本語で簡潔に回答してください。根拠が見つからなければ、その旨を明示してください。"
        )
        return AsyncThrowingStream { continuation in
            Task {
                do {
                    for try await partial in session.streamResponse(to: question) {
                        continuation.yield(partial.content)
                    }
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }

    func entity(for identifier: String) -> MobileSearchResult? {
        guard isEnabled,
              let identity = LocalIndexIdentity(uniqueIdentifier: identifier), identity.ownerDigest == activeOwnerDigest,
              let record = cachedRecord(domain: identity.domain, id: identity.recordID)
        else { return nil }
        return MobileSearchResult(id: record.id, type: identity.domain, title: record.displayTitle, snippet: Self.contentDescription(record))
    }

    func entities(for identifiers: [String]) -> [MobileSearchResult] {
        identifiers.compactMap(entity(for:))
    }

    func suggestedEntities(limit: Int = 20) -> [MobileSearchResult] {
        guard isEnabled else { return [] }
        let owner = authentication.ownerKey
        var descriptor = FetchDescriptor<CachedMobileRecord>(
            predicate: #Predicate { $0.ownerKey == owner },
            sortBy: [SortDescriptor(\.createdAt, order: .reverse)]
        )
        descriptor.fetchLimit = limit
        return ((try? context.fetch(descriptor)) ?? []).compactMap { row in
            guard let domain = MobileDomain(rawValue: row.domainValue),
                  let record = try? MobileAPICoding.decoder().decode(MobileRecord.self, from: row.recordData)
            else { return nil }
            return MobileSearchResult(id: record.id, type: domain, title: record.displayTitle, snippet: Self.contentDescription(record))
        }
    }

    func stableIdentifier(domain: MobileDomain, recordID: String) -> String {
        LocalIndexIdentity(owner: authentication.ownerKey, domain: domain, recordID: recordID).uniqueIdentifier
    }

    private func cachedRecord(domain: MobileDomain, id: String) -> MobileRecord? {
        let key = "\(authentication.ownerKey):\(domain.rawValue):\(id)"
        guard let row = try? context.fetch(FetchDescriptor<CachedMobileRecord>(predicate: #Predicate { $0.cacheKey == key })).first
        else { return nil }
        return try? MobileAPICoding.decoder().decode(MobileRecord.self, from: row.recordData)
    }

    private func scheduleIndexing(_ operation: @escaping @MainActor () async throws -> Void) {
        let previousTask = indexTask
        indexTask = Task { @MainActor in
            await previousTask?.value
            guard !Task.isCancelled else { return }
            isIndexing = true
            defer { isIndexing = false }
            do {
                try await operation()
                indexError = nil
            } catch is CancellationError {
                return
            } catch {
                indexError = error.localizedDescription
            }
        }
    }

    private static func defaultsKey(owner: String) -> String {
        defaultsPrefix + LocalIndexIdentity.digest(owner)
    }

    private static func snapshotEntry(owner: String, domain: MobileDomain, record: MobileRecord) -> SpotlightSnapshotEntry {
        let identity = LocalIndexIdentity(owner: owner, domain: domain, recordID: record.id)
        return SpotlightSnapshotEntry(
            uniqueIdentifier: identity.uniqueIdentifier,
            domainIdentifier: identity.ownerDigest,
            contentTypeIdentifier: domain.contentType.identifier,
            title: record.displayTitle,
            textContent: searchableText(record),
            contentDescription: contentDescription(record),
            keywords: ([domain.title, record.categoryName, record.isbn] + (record.tags ?? [])).compactMap { $0 },
            createdAt: record.createdAt,
            modifiedAt: record.updatedAt,
            contentURL: URL(string: "memdex://content/\(domain.rawValue)/\(record.id.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? record.id)")
        )
    }

    private static func searchableText(_ record: MobileRecord) -> String {
        [record.title, record.url, record.quote, record.markdown, record.isbn, record.categoryName,
         record.tags?.joined(separator: " ")].compactMap { $0 }.joined(separator: "\n")
    }

    private static func contentDescription(_ record: MobileRecord) -> String {
        let text = record.markdown ?? record.quote ?? record.url ?? record.tags?.joined(separator: ", ") ?? ""
        return String(text.prefix(500))
    }
}

private extension MobileDomain {
    var contentType: UTType {
        switch self {
        case .articles: .url
        case .notes: .plainText
        case .books: .item
        case .images: .image
        }
    }
}
