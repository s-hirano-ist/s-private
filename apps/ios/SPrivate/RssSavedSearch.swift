import Foundation
import FoundationModels

enum RssSavedTopic: String, CaseIterable, Sendable {
    case technology, business, society, lifestyle, culture, uncategorized

    var title: String {
        switch self {
        case .technology: String(localized: "テクノロジー")
        case .business: String(localized: "ビジネス・仕事")
        case .society: String(localized: "社会・ニュース")
        case .lifestyle: String(localized: "暮らし・健康")
        case .culture: String(localized: "文化・エンタメ")
        case .uncategorized: String(localized: "未分類")
        }
    }

    private typealias TopicTerms = (english: Set<String>, japanese: [String])
    private static let termsByTopic: [Self: TopicTerms] = [
        .technology: (
            ["ai", "apple", "coding", "cybersecurity", "developer", "ios", "javascript", "programming", "python", "react", "software", "swift", "swiftui", "tech", "technology", "typescript"],
            ["テクノロジー", "プログラミング", "エンジニア", "セキュリティ", "ソフトウェア", "生成ai", "人工知能", "技術"]
        ),
        .business: (
            ["business", "career", "earnings", "finance", "investing", "management", "marketing", "startup", "work"],
            ["ビジネス", "仕事", "経営", "投資", "金融", "転職", "マーケティング", "スタートアップ", "働き方"]
        ),
        .society: (
            ["climate", "election", "government", "news", "policy", "politics", "society"],
            ["ニュース", "社会", "政治", "選挙", "政府", "政策", "気候", "自治体"]
        ),
        .lifestyle: (
            ["cooking", "fitness", "food", "health", "lifestyle", "recipe", "sleep", "travel"],
            ["暮らし", "健康", "料理", "レシピ", "睡眠", "旅行", "医療", "運動"]
        ),
        .culture: (
            ["anime", "art", "books", "cinema", "culture", "entertainment", "film", "games", "music"],
            ["文化", "映画", "音楽", "アニメ", "漫画", "ゲーム", "演劇", "美術", "読書", "エンタメ"]
        ),
    ]

    fileprivate func matches(_ foldedTitle: String) -> Bool {
        let words = Set(foldedTitle.split { !$0.isASCII || (!$0.isLetter && !$0.isNumber) }.map(String.init))
        func matchesTerms(_ terms: TopicTerms) -> Bool {
            !terms.english.isDisjoint(with: words) || terms.japanese.contains { foldedTitle.contains($0) }
        }
        if let terms = Self.termsByTopic[self] { return matchesTerms(terms) }
        return !Self.termsByTopic.values.contains(where: matchesTerms)
    }
}

struct RssSavedFilter: Hashable, Sendable {
    typealias Interpreter = @Sendable (String) async throws -> RssSavedFilter?

    var query = ""
    var topic: RssSavedTopic?
    var alternatives: [String] = []

    var isActive: Bool { !Self.trim(query).isEmpty || topic != nil || !alternatives.isEmpty }

    func apply(to entries: [RssEntry]) -> [RssEntry] {
        guard isActive else { return entries }
        let manualTerms = Self.fold(query).split(whereSeparator: \.isWhitespace)
        let aiTerms = alternatives.map(Self.fold)
        return entries.filter { entry in
            guard !Task.isCancelled else { return false }
            let title = Self.fold(entry.title)
            if let topic, !topic.matches(title) { return false }
            if manualTerms.isEmpty && aiTerms.isEmpty { return true }
            let url = Self.fold(entry.url)
            if !aiTerms.isEmpty {
                return aiTerms.contains { title.contains($0) || url.contains($0) }
            }
            return manualTerms.allSatisfy { title.contains($0) || url.contains($0) }
        }
    }

    static func trim(_ string: String) -> String {
        string.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private static func fold(_ string: String) -> String {
        string.folding(options: [.caseInsensitive, .widthInsensitive, .diacriticInsensitive], locale: Locale(identifier: "en_US_POSIX"))
    }

    static func resolve(
        _ input: String,
        interpret: Interpreter
    ) async throws -> (filter: RssSavedFilter, usedManualSearch: Bool) {
        let input = String(trim(input).prefix(300))
        try Task.checkCancellation()
        let interpreted = try? await interpret(input)
        try Task.checkCancellation()
        if let filter = interpreted, filter.isActive { return (filter, false) }
        return (RssSavedFilter(query: input), true)
    }
}

enum RssSavedIntelligence {
    @Generable
    struct SearchConditions {
        @Guide(description: "A supported category key, only if the user requested that category. Otherwise nil.")
        var category: String?
        @Guide(description: "Up to five short equivalent search terms for the requested subject, including the original term when applicable. Empty for category-only requests.")
        var terms: [String]
    }

    static func interpret(_ input: String) async throws -> RssSavedFilter? {
        guard SystemLanguageModel.default.isAvailable else { return nil }
        let session = LanguageModelSession(
            model: .default,
            instructions: """
            Convert a Japanese or English request into conditions for searching saved RSS article titles and URLs.
            Extract a specific subject as short alternative words or phrases, removing conversational filler.
            Only use a category when the user requests a category explicitly:
            technology (テクノロジー), business (ビジネス・仕事), society (社会・ニュース),
            lifestyle (暮らし・健康), culture (文化・エンタメ), uncategorized (未分類).
            If the request cannot be represented by these conditions, leave both fields empty.
            """
        )
        let conditions = try await session.respond(to: input, generating: SearchConditions.self).content
        let topic = conditions.category.flatMap(RssSavedTopic.init(rawValue:))
        let alternatives = conditions.terms.map(RssSavedFilter.trim).filter { !$0.isEmpty && $0.count <= 80 }
        return RssSavedFilter(topic: topic, alternatives: Array(alternatives.prefix(5)))
    }
}
