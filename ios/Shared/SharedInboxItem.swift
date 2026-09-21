import Foundation

enum SharedInboxItemKind: String, Codable, CaseIterable, Sendable {
    case image
    case text
    case url
}

struct SharedInboxItem: Codable, Equatable, Identifiable, Sendable {
    static let currentSchemaVersion = 1

    let schemaVersion: Int
    let operationID: UUID
    let kind: SharedInboxItemKind
    let text: String?
    let attachmentRelativePath: String?
    let createdAt: Date

    var id: UUID { operationID }

    init(
        schemaVersion: Int = Self.currentSchemaVersion,
        operationID: UUID = UUID(),
        kind: SharedInboxItemKind,
        text: String? = nil,
        attachmentRelativePath: String? = nil,
        createdAt: Date = Date()
    ) {
        self.schemaVersion = schemaVersion
        self.operationID = operationID
        self.kind = kind
        self.text = text
        self.attachmentRelativePath = attachmentRelativePath
        self.createdAt = createdAt
    }
}
