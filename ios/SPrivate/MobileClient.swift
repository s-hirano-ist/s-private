import Foundation

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
struct MobileCategories: Decodable { let data: [MobileCategory] }
struct MobileManifestItem: Decodable {
    let id: String
    let updatedAt: Date
}
struct MobileManifest: Decodable {
    let articles: [MobileManifestItem]
    let notes: [MobileManifestItem]
    let books: [MobileManifestItem]
    let images: [MobileRecord]
    let categories: [MobileCategory]

    func items(for domain: MobileDomain) -> [MobileManifestItem] {
        switch domain {
        case .articles: articles
        case .notes: notes
        case .books: books
        case .images: images.map { MobileManifestItem(id: $0.id, updatedAt: $0.updatedAt) }
        }
    }
}
struct MobileAccepted: Decodable { let accepted: Bool }
private struct UploadStart: Encodable {
    let operationId: UUID
    let domain: MobileDomain
    let contentType: String
    let fileSize: Int
    let metadata: [String: String]
}
private struct UploadSession: Decodable {
    let uploadId: String
    let chunkSize: Int
    let receivedParts: [Int]
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
struct MobileSearchResponse: Decodable {
    let data: [MobileSearchResult]
    let query: String
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
    let categoryName: String?
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
final class MobileClient {
    static let imageLimit = 10 * 1_048_576
    let authentication: AuthenticationModel
    let baseURL: URL?
    let session: URLSession

    init(authentication: AuthenticationModel, bundle: Bundle = .main, session: URLSession = .shared) {
        self.authentication = authentication
        self.baseURL = URL(string: bundle.object(forInfoDictionaryKey: "MobileAPIBaseURL") as? String ?? "")
        self.session = session
    }

    func list(_ domain: MobileDomain, status: MobileContentStatus?, offset: Int, limit: Int = 30) async throws -> MobilePage<MobileRecord> {
        var query = [URLQueryItem(name: "offset", value: String(offset)), URLQueryItem(name: "limit", value: String(limit))]
        if let status { query.append(URLQueryItem(name: "status", value: status.rawValue)) }
        return try await decode(domain.rawValue, query: query)
    }

    func detail(_ domain: MobileDomain, id: String) async throws -> MobileRecord {
        try await decode("\(domain.rawValue)/\(encoded(id))")
    }

    func categories() async throws -> [MobileCategory] {
        let result: MobileCategories = try await decode("categories")
        return result.data
    }

    func manifest() async throws -> MobileManifest {
        try await decode("manifest")
    }

    func search(_ query: String) async throws -> [MobileSearchResult] {
        let result: MobileSearchResponse = try await decode("search", query: [URLQueryItem(name: "query", value: query)])
        return result.data
    }

    func media(_ domain: MobileDomain, id: String, variant: String) async throws -> Data {
        try await send("media/\(domain.rawValue)/\(encoded(id))/\(variant)")
    }

    func create(_ domain: MobileDomain, input: MobileCreate) async throws {
        var request = try await makeRequest(domain.rawValue, method: "POST")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(input)
        let data = try await perform(request)
        guard try MobileAPICoding.decoder().decode(MobileAccepted.self, from: data).accepted else {
            throw MobileClientError.invalidResponse
        }
    }

    func chunkedUpload(_ domain: MobileDomain, operationId: UUID, image: Data, fields: [String: String]) async throws {
        guard image.count <= Self.imageLimit else { throw MobileClientError.uploadTooLarge }
        let start = UploadStart(operationId: operationId, domain: domain, contentType: "image/jpeg", fileSize: image.count, metadata: fields)
        var request = try await makeRequest("uploads", method: "POST")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(start)
        let upload = try MobileAPICoding.decoder().decode(UploadSession.self, from: await perform(request))
        let received = Set(upload.receivedParts)
        for part in 0..<Int(ceil(Double(image.count) / Double(upload.chunkSize))) where !received.contains(part) {
            let lower = part * upload.chunkSize
            let upper = min(lower + upload.chunkSize, image.count)
            var chunkRequest = try await makeRequest("uploads/\(upload.uploadId)/chunks/\(part)", method: "PUT")
            chunkRequest.setValue("application/octet-stream", forHTTPHeaderField: "Content-Type")
            chunkRequest.httpBody = image.subdata(in: lower..<upper)
            _ = try await perform(chunkRequest)
        }
        let complete = try await makeRequest("uploads/\(upload.uploadId)/complete", method: "POST")
        _ = try await perform(complete)
    }

    func delete(_ domain: MobileDomain, id: String) async throws {
        let request = try await makeRequest("\(domain.rawValue)/\(encoded(id))", method: "DELETE")
        _ = try await perform(request)
    }

    private func decode<T: Decodable>(_ path: String, query: [URLQueryItem] = []) async throws -> T {
        let data = try await send(path, query: query)
        return try MobileAPICoding.decoder().decode(T.self, from: data)
    }

    private func send(_ path: String, query: [URLQueryItem] = []) async throws -> Data {
        try await perform(makeRequest(path, query: query))
    }

    private func makeRequest(_ path: String, query: [URLQueryItem] = [], method: String = "GET") async throws -> URLRequest {
        guard let baseURL, ["https", "http"].contains(baseURL.scheme?.lowercased() ?? ""), baseURL.host != nil else {
            throw MobileClientError.configurationMissing
        }
        var components = URLComponents(url: baseURL.appending(path: path), resolvingAgainstBaseURL: false)
        components?.queryItems = query.isEmpty ? nil : query
        guard let url = components?.url else { throw MobileClientError.configurationMissing }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("Bearer \(try await authentication.accessToken())", forHTTPHeaderField: "Authorization")
        return request
    }

    private func perform(_ request: URLRequest) async throws -> Data {
        let (data, response) = try await session.data(for: request)
        guard let response = response as? HTTPURLResponse else { throw MobileClientError.invalidResponse }
        guard (200..<300).contains(response.statusCode) else {
            let code = try? MobileAPICoding.decoder().decode(MobileAPIErrorEnvelope.self, from: data).error.code
            if response.statusCode == 401 { authentication.requireLogin() }
            throw MobileClientError.http(response.statusCode, code)
        }
        return data
    }

    private func encoded(_ value: String) -> String {
        value.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed.subtracting(CharacterSet(charactersIn: "/?%#"))) ?? value
    }
}
