import Foundation

enum MobileClientError: LocalizedError {
    case authenticationRequired, configurationMissing, invalidResponse, uploadTooLarge
    case http(Int, String?)

    var errorDescription: String? {
        switch self {
        case .authenticationRequired: String(localized: "ログインが必要です")
        case .configurationMissing: String(localized: "接続先が設定されていません")
        case .invalidResponse: String(localized: "サーバーの応答を読み取れません")
        case .uploadTooLarge: String(localized: "画像は1 MiB以下にしてください")
        case let .http(status, code): "\(code ?? "HTTP_ERROR") (HTTP \(status))"
        }
    }
}

struct MobileCategory: Decodable, Identifiable {
    let id: String
    let name: String
}
struct MobileCategories: Decodable { let data: [MobileCategory] }
struct MobileAccepted: Decodable { let accepted: Bool }

enum MobileDomain: String, Codable, CaseIterable, Identifiable {
    case articles, notes, images, books
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

struct MobileRecord: Decodable, Identifiable {
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

struct MobileCreate: Encodable {
    let operationId: UUID
    let title: String
    let url: String?
    let category: String?
    let quote: String?
    let markdown: String?
}

@MainActor
final class MobileClient {
    static let imageLimit = 1_048_576
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

    func upload(_ domain: MobileDomain, image: Data, fields: [String: String]) async throws {
        guard image.count <= Self.imageLimit else { throw MobileClientError.uploadTooLarge }
        let boundary = "SPrivate-\(UUID().uuidString)"
        var body = Data()
        for (key, value) in fields.sorted(by: { $0.key < $1.key }) {
            body.append(Data("--\(boundary)\r\nContent-Disposition: form-data; name=\"\(key)\"\r\n\r\n\(value)\r\n".utf8))
        }
        let field = domain == .images ? "file" : "image"
        body.append(Data("--\(boundary)\r\nContent-Disposition: form-data; name=\"\(field)\"; filename=\"image.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n".utf8))
        body.append(image)
        body.append(Data("\r\n--\(boundary)--\r\n".utf8))
        var request = try await makeRequest(domain.rawValue, method: "POST")
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        request.httpBody = body
        let data = try await perform(request)
        guard try MobileAPICoding.decoder().decode(MobileAccepted.self, from: data).accepted else {
            throw MobileClientError.invalidResponse
        }
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
