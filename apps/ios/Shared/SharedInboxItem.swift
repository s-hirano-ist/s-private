import Foundation

enum SharedInboxItemKind: String, Codable, CaseIterable, Sendable {
    case image
    case text
    case url
}

struct SharedInboxItem: Codable, Equatable, Identifiable, Sendable {
    static let currentSchemaVersion = 2

    let schemaVersion: Int
    let operationID: UUID
    let kind: SharedInboxItemKind
    let text: String?
    let title: String?
    let category: String?
    let attachmentRelativePath: String?
    let createdAt: Date

    var id: UUID { operationID }

    init(
        schemaVersion: Int = Self.currentSchemaVersion,
        operationID: UUID = UUID(),
        kind: SharedInboxItemKind,
        text: String? = nil,
        title: String? = nil,
        category: String? = nil,
        attachmentRelativePath: String? = nil,
        createdAt: Date = Date()
    ) {
        self.schemaVersion = schemaVersion
        self.operationID = operationID
        self.kind = kind
        self.text = text
        self.title = title
        self.category = category
        self.attachmentRelativePath = attachmentRelativePath
        self.createdAt = createdAt
    }
}
