import Foundation

// Device cache status and coding preserve existing SwiftData payloads. HTTP DTOs are generated.
enum MobileContentStatus: String, Codable {
    case unexported = "UNEXPORTED"
    case lastUpdated = "LAST_UPDATED"
    case exported = "EXPORTED"
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
