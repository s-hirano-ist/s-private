import AppIntents
import CoreSpotlight
import Foundation
import UniformTypeIdentifiers

struct MemdexContentEntity: AppEntity, IndexedEntity, SyncableEntity {
    static let typeDisplayRepresentation = TypeDisplayRepresentation(name: "Memdexコンテンツ")
    static let defaultQuery = MemdexContentEntityQuery()

    let id: String

    @Property(title: "タイトル")
    var title: String

    @Property(title: "種類")
    var domainValue: String

    @Property(title: "抜粋")
    var snippet: String

    init(id: String, title: String, domainValue: String, snippet: String) {
        self.id = id
        self.title = title
        self.domainValue = domainValue
        self.snippet = snippet
    }

    var domain: MobileDomain { MobileDomain(rawValue: domainValue) ?? .notes }

    var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(
            title: "\(title)",
            subtitle: "\(domain.title)",
            image: .init(systemName: domain.symbol)
        )
    }

    var attributeSet: CSSearchableItemAttributeSet {
        let attributes = CSSearchableItemAttributeSet(contentType: domain.contentTypeForIntent)
        attributes.title = title
        attributes.displayName = title
        attributes.contentDescription = snippet
        attributes.textContent = snippet
        return attributes
    }
}

struct MemdexContentEntityQuery: EntityStringQuery {
    @Dependency private var localIntelligence: LocalIntelligenceCoordinator

    init() {}

    func entities(for identifiers: [MemdexContentEntity.ID]) async throws -> [MemdexContentEntity] {
        let results = await localIntelligence.entities(for: identifiers)
        return await makeEntities(results)
    }

    func suggestedEntities() async throws -> [MemdexContentEntity] {
        let results = await localIntelligence.suggestedEntities()
        return await makeEntities(results)
    }

    func entities(matching string: String) async throws -> [MemdexContentEntity] {
        let results = try await localIntelligence.search(string, limit: 20)
        return await makeEntities(results)
    }

    private func makeEntities(_ results: [MobileSearchResult]) async -> [MemdexContentEntity] {
        var entities: [MemdexContentEntity] = []
        for result in results {
            let identifier = await localIntelligence.stableIdentifier(domain: result.type, recordID: result.id)
            entities.append(MemdexContentEntity(
                id: identifier,
                title: result.title,
                domainValue: result.type.rawValue,
                snippet: result.snippet
            ))
        }
        return entities
    }
}

@AppIntent(schema: .system.searchInApp)
struct SearchMemdexIntent: ShowInAppSearchResultsIntent {
    static let searchScopes: [StringSearchScope] = [.general]
    static let allowedExecutionTargets: IntentExecutionTargets = .main

    var criteria: StringSearchCriteria

    @Dependency private var navigation: AppNavigationModel

    func perform() async throws -> some IntentResult {
        await navigation.showSearch(criteria.term)
        return .result()
    }
}

@AppIntent(schema: .system.open)
struct OpenMemdexContentIntent: OpenIntent {
    static let allowedExecutionTargets: IntentExecutionTargets = .main

    var target: MemdexContentEntity

    @Dependency private var navigation: AppNavigationModel

    func perform() async throws -> some IntentResult {
        await navigation.open(domain: target.domain, recordID: LocalIndexIdentity(uniqueIdentifier: target.id)?.recordID ?? target.id)
        return .result()
    }
}

struct CreateMemdexNoteIntent: AppIntent {
    static let title: LocalizedStringResource = "Memdexにノートを作成"
    static let description = IntentDescription("タイトルと本文を端末へ保存し、Memdexと同期します。")
    static let allowedExecutionTargets: IntentExecutionTargets = .main
    static let authenticationPolicy: IntentAuthenticationPolicy = .requiresAuthentication

    @Parameter(title: "タイトル")
    var title: String

    @Parameter(title: "本文")
    var content: String

    @Dependency private var sync: SyncCoordinator

    init() {}

    init(title: String, content: String) {
        self.title = title
        self.content = content
    }

    func perform() async throws -> some IntentResult & ReturnsValue<String> & ProvidesDialog {
        let operationID = try await sync.enqueueNoteFromIntent(title: title, markdown: content)
        return .result(
            value: operationID.uuidString,
            dialog: IntentDialog(stringLiteral: "ノートを端末に保存しました。同期を開始します。")
        )
    }
}

struct SearchSavedRssIntent: AppIntent {
    static let title: LocalizedStringResource = "保存済みRSSを検索"
    static let description = IntentDescription("検索内容を指定して、Memdexの保存済みRSSを絞り込みます。")
    static let supportedModes: IntentModes = .foreground(.immediate)
    static let allowedExecutionTargets: IntentExecutionTargets = .main
    static let authenticationPolicy: IntentAuthenticationPolicy = .requiresAuthentication

    @Parameter(title: "RSSの検索内容", requestValueDialog: "保存済みRSSで何を探しますか？")
    var query: String

    static var parameterSummary: some ParameterSummary {
        Summary("保存済みRSSで\(\.$query)を検索")
    }

    @Dependency private var navigation: AppNavigationModel
    @Dependency private var rss: RssReaderModel

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard !rss.scope.isEmpty else {
            return .result(dialog: "Memdexにログインしてから、もう一度実行してください。")
        }
        let input = String(RssSavedFilter.trim(query).prefix(300))
        guard !input.isEmpty else {
            return .result(dialog: "検索内容を入力してください。")
        }
        navigation.showSavedRss(input, readerIdentity: rss.identityID)
        return .result(dialog: "Memdexで保存済みRSSを検索します。")
    }
}

struct MemdexShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: CreateMemdexNoteIntent(),
            phrases: [
                "\(.applicationName)にノートを作成",
                "\(.applicationName)にメモを追加",
            ],
            shortTitle: "ノートを作成",
            systemImageName: "note.text.badge.plus"
        )
        AppShortcut(
            intent: SearchSavedRssIntent(),
            phrases: ["\(.applicationName)で保存済みRSSを検索"],
            shortTitle: "保存済みRSSを検索",
            systemImageName: "magnifyingglass"
        )
    }

    static let shortcutTileColor: ShortcutTileColor = .navy
}

private extension MobileDomain {
    var contentTypeForIntent: UTType {
        switch self {
        case .articles: .url
        case .notes: .plainText
        case .books: .item
        case .images: .image
        }
    }
}
