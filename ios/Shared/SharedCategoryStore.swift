import Foundation

struct SharedCategoryStore {
    private let snapshotURL: URL

    init(containerURL: URL? = FileManager.default.containerURL(
        forSecurityApplicationGroupIdentifier: SharedInboxStore.appGroupIdentifier
    )) throws {
        guard let containerURL else { throw SharedInboxStoreError.appGroupUnavailable }
        snapshotURL = containerURL.appending(path: "ArticleCategories.json")
    }

    func load() throws -> [String] {
        guard FileManager.default.fileExists(atPath: snapshotURL.path) else { return [] }
        return try JSONDecoder().decode([String].self, from: Data(contentsOf: snapshotURL))
    }

    func replace(with names: [String]) throws {
        let validNames = Array(Set(names.map(ArticleCategoryName.normalized).filter(ArticleCategoryName.isValid)))
            .sorted { $0.localizedStandardCompare($1) == .orderedAscending }
        try JSONEncoder().encode(validNames).write(to: snapshotURL, options: .atomic)
    }

    func clear() throws {
        guard FileManager.default.fileExists(atPath: snapshotURL.path) else { return }
        try FileManager.default.removeItem(at: snapshotURL)
    }
}
