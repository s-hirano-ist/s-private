import Foundation
import SPrivateAPI

// Generated DTOs stop at this adapter; persisted device models keep their existing shape.
extension MobileContentStatus {
    init(_ value: Components.Schemas.ContentStatus) {
        switch value {
        case .UNEXPORTED: self = .unexported
        case .LAST_UPDATED: self = .lastUpdated
        case .EXPORTED: self = .exported
        }
    }
}

extension MobileRecord {
    init(snapshot: Components.Schemas.SnapshotRecord, expected: MobileDomain) throws {
        switch (expected, snapshot) {
        case (.articles, .articles(let value)): self.init(value.record)
        case (.notes, .notes(let value)): self.init(value.record)
        case (.images, .images(let value)): self.init(value.record)
        case (.books, .books(let value)): self.init(value.record)
        default: throw MobileClientError.invalidResponse
        }
    }
    init(_ value: Components.Schemas.Article) {
        self.init(
            id: value.id, status: MobileContentStatus(value.status), createdAt: value.createdAt,
            updatedAt: value.updatedAt, exportedAt: value.exportedAt, title: value.title,
            url: value.url, quote: value.quote, categoryId: value.categoryId,
            categoryName: value.categoryName, markdown: nil, isbn: nil,
            rating: nil, tags: nil, path: nil,
            imagePath: nil, contentType: nil, fileSize: nil
        )
    }
    init(_ value: Components.Schemas.Note) {
        self.init(
            id: value.id, status: MobileContentStatus(value.status), createdAt: value.createdAt,
            updatedAt: value.updatedAt, exportedAt: value.exportedAt, title: value.title,
            url: nil, quote: nil, categoryId: nil,
            categoryName: nil, markdown: value.markdown, isbn: nil,
            rating: nil, tags: nil, path: nil,
            imagePath: nil, contentType: nil, fileSize: nil
        )
    }
    init(_ value: Components.Schemas.Image) {
        self.init(
            id: value.id, status: MobileContentStatus(value.status), createdAt: value.createdAt,
            updatedAt: value.updatedAt, exportedAt: value.exportedAt, title: nil,
            url: nil, quote: nil, categoryId: nil,
            categoryName: nil, markdown: nil, isbn: nil,
            rating: nil, tags: nil, path: value.path,
            imagePath: nil, contentType: value.contentType.rawValue, fileSize: value.fileSize
        )
    }
    init(_ value: Components.Schemas.Book) {
        self.init(
            id: value.id, status: MobileContentStatus(value.status), createdAt: value.createdAt,
            updatedAt: value.updatedAt, exportedAt: value.exportedAt, title: value.title,
            url: nil, quote: nil, categoryId: nil,
            categoryName: nil, markdown: value.markdown, isbn: value.isbn,
            rating: value.rating, tags: value.tags, path: nil,
            imagePath: value.imagePath, contentType: nil, fileSize: nil
        )
    }
}

extension MobileSyncChange {
    init(_ value: Components.Schemas.SyncChange) {
        switch value {
        case .delete(let change):
            self.init(version: change.version, domain: change.domain.rawValue, id: change.id, action: "delete", record: nil, category: nil)
        case .upsert(let change):
            let domain: String
            let record: MobileRecord?
            let category: MobileCategory?
            switch change.value {
            case .articles(let value): domain = "articles"; record = MobileRecord(value.record); category = nil
            case .notes(let value): domain = "notes"; record = MobileRecord(value.record); category = nil
            case .images(let value): domain = "images"; record = MobileRecord(value.record); category = nil
            case .books(let value): domain = "books"; record = MobileRecord(value.record); category = nil
            case .categories(let value): domain = "categories"; record = nil; category = MobileCategory(id: value.record.id, name: value.record.name)
            }
            self.init(version: change.version, domain: domain, id: change.id, action: "upsert", record: record, category: category)
        }
    }
}

extension MobileSearchResult {
    init(_ value: Components.Schemas.SearchHit) {
        switch value {
        case .articles(let value): self.init(id: value.id, type: .articles, title: value.title, snippet: value.snippet)
        case .notes(let value): self.init(id: value.id, type: .notes, title: value.title, snippet: value.snippet)
        case .books(let value): self.init(id: value.id, type: .books, title: value.title, snippet: value.snippet)
        }
    }
}

extension MobileCreate {
    func articleBody() throws -> Components.Schemas.ArticleCreate {
        guard let url, let category else { throw MobileClientError.invalidResponse }
        return .init(operationId: operationId.uuidString, title: title, url: url, category: category, quote: quote)
    }
    func noteBody() throws -> Components.Schemas.NoteCreate {
        guard let markdown else { throw MobileClientError.invalidResponse }
        return .init(operationId: operationId.uuidString, title: title, markdown: markdown)
    }
    static func uploadBody(_ domain: MobileDomain, operationId: UUID, fileSize: Int, fields: [String: String]) throws -> Components.Schemas.UploadStart {
        switch domain {
        case .images:
            return .images(.init(operationId: operationId.uuidString, contentType: .image_sol_jpeg, fileSize: fileSize, domain: .images, metadata: .init(filename: fields["filename"] ?? "upload")))
        case .books:
            guard let isbn = fields["isbn"], let title = fields["title"], let ratingText = fields["rating"], let rating = Int(ratingText) else { throw MobileClientError.invalidResponse }
            // Keep every CSV segment (including whitespace/empty ones). The backend uses the
            // exact original string to replay legacy operations, then normalizes domain tags.
            let tags = (fields["tags"] ?? "").components(separatedBy: ",")
            return .books(.init(operationId: operationId.uuidString, contentType: .image_sol_jpeg, fileSize: fileSize, domain: .books, metadata: .init(filename: fields["filename"], isbn: isbn, title: title, rating: rating, tags: tags)))
        case .articles, .notes: throw MobileClientError.invalidResponse
        }
    }
    static func validate(_ result: Components.Schemas.CreateResult, operationId: UUID, domain: MobileDomain) throws {
        guard result.accepted, result.operationId == operationId.uuidString, result.resource._type.rawValue == domain.rawValue, !result.resource.id.isEmpty else {
            throw MobileClientError.invalidResponse
        }
    }
}
