import Foundation
import OpenAPIRuntime
import SPrivateAPI

enum MobileClientError: LocalizedError {
    case authenticationRequired, configurationMissing, invalidResponse, uploadTooLarge
    case http(Int, String?)

    var errorDescription: String? {
        switch self {
        case .authenticationRequired: String(localized: "ログインが必要です")
        case .configurationMissing: String(localized: "接続先が設定されていません")
        case .invalidResponse: String(localized: "サーバーの応答を読み取れません")
        case .uploadTooLarge: String(localized: "画像は10 MiB以下にしてください")
        case let .http(status, code): "\(code ?? "HTTP_ERROR") (HTTP \(status))"
        }
    }
}

struct MobileCategory: Decodable, Identifiable {
    let id: String
    let name: String
}
struct MobileSnapshotPage<Item: Decodable>: Decodable {
    let data: [Item]
    let nextAfter: String?
}
struct MobileSyncChange: Decodable {
    let version: String
    let domain: String
    let id: String
    let action: String
    let record: MobileRecord?
    let category: MobileCategory?
}
struct MobileSyncChanges: Decodable {
    let data: [MobileSyncChange]
    let nextCursor: String
    let hasMore: Bool
}
enum MobileDomain: String, Codable, CaseIterable, Identifiable {
    case articles, notes, books, images
    var id: String { rawValue }
    var title: String {
        switch self {
        case .articles: String(localized: "記事")
        case .notes: String(localized: "ノート")
        case .images: String(localized: "画像")
        case .books: String(localized: "書籍")
        }
    }
    var symbol: String {
        switch self {
        case .articles: "link"
        case .notes: "note.text"
        case .images: "photo"
        case .books: "books.vertical"
        }
    }
}

struct MobileSearchResult: Decodable, Identifiable {
    let id: String
    let type: MobileDomain
    let title: String
    let snippet: String
}
struct MobileRecord: Codable, Identifiable {
    let id: String
    let status: MobileContentStatus
    let createdAt: Date
    let updatedAt: Date
    let exportedAt: Date?
    let title: String?
    let url: String?
    let quote: String?
    let categoryId: String?
    var categoryName: String?
    let markdown: String?
    let isbn: String?
    let rating: Int?
    let tags: [String]?
    let path: String?
    let imagePath: String?
    let contentType: String?
    let fileSize: Int?
    var displayTitle: String { title ?? String(localized: "画像") }
}

struct MobileCreate: Codable {
    let operationId: UUID
    let title: String
    let url: String?
    let category: String?
    let quote: String?
    let markdown: String?
    let isbn: String?
    let rating: Int?
    let tags: String?

    init(operationId: UUID, title: String, url: String? = nil, category: String? = nil, quote: String? = nil, markdown: String? = nil, isbn: String? = nil, rating: Int? = nil, tags: String? = nil) {
        self.operationId = operationId; self.title = title; self.url = url; self.category = category
        self.quote = quote; self.markdown = markdown; self.isbn = isbn; self.rating = rating; self.tags = tags
    }

    var uploadFields: [String: String] {
        var fields: [String: String] = [:]
        if let isbn { fields["isbn"] = isbn }; if let rating { fields["rating"] = String(rating) }
        if let tags { fields["tags"] = tags }; if !title.isEmpty { fields["title"] = title }
        return fields
    }
}

@MainActor
protocol MobileSyncClient {
    func create(_ domain: MobileDomain, input: MobileCreate) async throws
    func chunkedUpload(_ domain: MobileDomain, operationId: UUID, image: Data, fields: [String: String]) async throws
    func syncHead() async throws -> String
    func snapshot(_ domain: String, after: String) async throws -> MobileSnapshotPage<MobileRecord>
    func categorySnapshot(after: String) async throws -> MobileSnapshotPage<MobileCategory>
    func changes(cursor: String) async throws -> MobileSyncChanges
    func media(_ domain: MobileDomain, id: String, variant: String) async throws -> Data
}

@MainActor
final class MobileClient: MobileSyncClient {
    static let imageLimit = 10 * 1_048_576
    let authentication: AuthenticationModel
    let baseURL: URL?
    private let injectedClient: Client?

    init(authentication: AuthenticationModel, bundle: Bundle = .main, client: Client? = nil) {
        self.authentication = authentication
        self.baseURL = URL(string: bundle.object(forInfoDictionaryKey: "MobileAPIBaseURL") as? String ?? "")
        self.injectedClient = client
    }

    func syncHead() async throws -> String {
        try await perform { try await $0.getSyncHead(.init()).ok.body.json.cursor }
    }

    func snapshot(_ domain: String, after: String = "") async throws -> MobileSnapshotPage<MobileRecord> {
        guard let domain = MobileDomain(rawValue: domain),
              let apiDomain = Components.Schemas.SyncDomain(rawValue: domain.rawValue) else {
            throw MobileClientError.invalidResponse
        }
        return try await perform { client in
            let page = try await client.listSyncSnapshot(.init(query: .init(domain: apiDomain, after: after))).ok.body.json
            return MobileSnapshotPage(data: try page.data.map { try MobileRecord(snapshot: $0, expected: domain) }, nextAfter: page.nextAfter)
        }
    }

    func categorySnapshot(after: String = "") async throws -> MobileSnapshotPage<MobileCategory> {
        try await perform { client in
            let page = try await client.listSyncSnapshot(.init(query: .init(domain: .categories, after: after))).ok.body.json
            let categories = try page.data.map { value in
                guard case .categories(let value) = value else { throw MobileClientError.invalidResponse }
                return MobileCategory(id: value.record.id, name: value.record.name)
            }
            return MobileSnapshotPage(data: categories, nextAfter: page.nextAfter)
        }
    }

    func changes(cursor: String) async throws -> MobileSyncChanges {
        try await perform { client in
            let page = try await client.listSyncChanges(.init(query: .init(cursor: cursor))).ok.body.json
            return MobileSyncChanges(data: page.data.map(MobileSyncChange.init), nextCursor: page.nextCursor, hasMore: page.hasMore)
        }
    }

    func search(_ query: String) async throws -> [MobileSearchResult] {
        try await perform { client in
            let page = try await client.searchContent(.init(query: .init(query: query))).ok.body.json
            return page.data.map(MobileSearchResult.init)
        }
    }

    func media(_ domain: MobileDomain, id: String, variant: String) async throws -> Data {
        guard let apiDomain = Operations.getMedia.Input.Path.domainPayload(rawValue: domain.rawValue),
              let variant = Operations.getMedia.Input.Path.variantPayload(rawValue: variant) else {
            throw MobileClientError.invalidResponse
        }
        return try await perform { client in
            let response = try await client.getMedia(.init(path: .init(domain: apiDomain, id: id, variant: variant))).ok.body
            let body: HTTPBody
            switch response {
            case .binary(let value), .jpeg(let value), .png(let value), .image_webp(let value): body = value
            }
            return try await Data(collecting: body, upTo: 32 * 1_048_576)
        }
    }

    func create(_ domain: MobileDomain, input: MobileCreate) async throws {
        try await perform { client in
            switch domain {
            case .articles:
                try MobileCreate.validate(try await client.createArticles(.init(body: .json(try input.articleBody()))).created.body.json, operationId: input.operationId, domain: domain)
            case .notes:
                try MobileCreate.validate(try await client.createNotes(.init(body: .json(try input.noteBody()))).created.body.json, operationId: input.operationId, domain: domain)
            case .images, .books:
                throw MobileClientError.invalidResponse
            }
        }
    }

    func chunkedUpload(_ domain: MobileDomain, operationId: UUID, image: Data, fields: [String: String]) async throws {
        guard image.count <= Self.imageLimit else { throw MobileClientError.uploadTooLarge }
        guard !image.isEmpty else { throw MobileClientError.invalidResponse }
        let start = try MobileCreate.uploadBody(domain, operationId: operationId, fileSize: image.count, fields: fields)
        try await perform { client in
            // Start on every explicit attempt: the backend resumes chunks, including legacy sessions.
            // A removed/expired session starts again with the same operation ID, never a new operation.
            let upload = try await client.startUpload(.init(body: .json(start))).ok.body.json
            let chunkSize = upload.chunkSize.rawValue
            guard chunkSize == 1_048_576, upload.operationId == operationId.uuidString else {
                throw MobileClientError.invalidResponse
            }
            let count = (image.count + chunkSize - 1) / chunkSize
            guard upload.receivedParts.allSatisfy({ (0..<count).contains($0) }) else { throw MobileClientError.invalidResponse }
            let received = Set(upload.receivedParts)
            for part in 0..<count where !received.contains(part) {
                let lower = part * chunkSize
                let upper = min(lower + chunkSize, image.count)
                let accepted = try await client.putUploadChunk(.init(path: .init(id: upload.uploadId, part: part), body: .binary(HTTPBody(image.subdata(in: lower..<upper))))).ok.body.json
                guard accepted.accepted, accepted.part == part else { throw MobileClientError.invalidResponse }
            }
            try MobileCreate.validate(try await client.completeUpload(.init(path: .init(id: upload.uploadId))).created.body.json, operationId: operationId, domain: domain)
        }
    }

    func delete(_ domain: MobileDomain, id: String) async throws {
        try await perform { client in
            switch domain {
            case .articles: _ = try await client.deleteArticles(.init(path: .init(id: id))).noContent
            case .notes: _ = try await client.deleteNotes(.init(path: .init(id: id))).noContent
            case .images: _ = try await client.deleteImages(.init(path: .init(id: id))).noContent
            case .books: _ = try await client.deleteBooks(.init(path: .init(id: id))).noContent
            }
        }
    }

    private func perform<T>(_ operation: @MainActor (Client) async throws -> T) async throws -> T {
        do {
            let client: Client
            if let injectedClient { client = injectedClient }
            else {
                guard let baseURL, ["https", "http"].contains(baseURL.scheme?.lowercased() ?? ""), baseURL.host != nil else {
                    throw MobileClientError.configurationMissing
                }
                client = BackendAPI.authenticatedClient(serverURL: baseURL, accessToken: try await authentication.accessToken())
            }
            return try await operation(client)
        } catch {
            if let failure = BackendHTTPError.from(error) {
                if failure.status == 401 { authentication.requireLogin() }
                throw MobileClientError.http(failure.status, failure.code?.rawValue)
            }
            // Preserve cancellation/network errors without exposing the generated request (including token).
            if let error = error as? ClientError { throw error.underlyingError }
            throw error
        }
    }
}
