import Foundation

// Codable payloads for docs/openapi/mobile-v1.yaml. The native domain screens
// will consume these in the next milestone.
struct MobilePage<Item: Decodable>: Decodable {
    let data: [Item]
    let totalCount: Int
    let offset: Int
    let limit: Int
}

enum MobileContentStatus: String, Codable {
    case unexported = "UNEXPORTED"
    case lastUpdated = "LAST_UPDATED"
    case exported = "EXPORTED"
}

struct MobileArticle: Decodable {
    let id: String
    let title: String
    let url: String
    let quote: String?
    let categoryId: String
    let categoryName: String
    let status: MobileContentStatus
    let createdAt: Date
    let updatedAt: Date
    let exportedAt: Date?
}

struct MobileNote: Decodable {
    let id: String
    let title: String
    let markdown: String
    let status: MobileContentStatus
    let createdAt: Date
    let updatedAt: Date
    let exportedAt: Date?
}

struct MobileImage: Decodable {
    let id: String
    let path: String
    let contentType: String
    let fileSize: Int?
    let width: Int?
    let height: Int?
    let status: MobileContentStatus
    let createdAt: Date
    let updatedAt: Date
    let exportedAt: Date?
}

struct MobileBook: Decodable {
    let id: String
    let isbn: String
    let title: String
    let markdown: String?
    let imagePath: String?
    let rating: Int
    let tags: [String]
    let status: MobileContentStatus
    let createdAt: Date
    let updatedAt: Date
    let exportedAt: Date?
}

struct MobileAPIErrorEnvelope: Decodable {
    let error: MobileAPIError
}

struct MobileAPIError: Decodable {
    let code: String
}

enum MobileAPICoding {
    static func decoder() -> JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let value = try decoder.singleValueContainer().decode(String.self)
            let withFractionalSeconds = ISO8601DateFormatter()
            withFractionalSeconds.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = withFractionalSeconds.date(from: value) { return date }
            if let date = ISO8601DateFormatter().date(from: value) { return date }
            throw DecodingError.dataCorruptedError(
                in: try decoder.singleValueContainer(),
                debugDescription: "Invalid ISO 8601 timestamp"
            )
        }
        return decoder
    }
}
