import Foundation
import SwiftData

enum PendingState: String, Codable, CaseIterable {
    case pending, sending, needsAttention, authenticationRequired

    var title: String {
        switch self {
        case .pending: String(localized: "保存待ち")
        case .sending: String(localized: "送信中")
        case .needsAttention: String(localized: "要修正")
        case .authenticationRequired: String(localized: "認証待ち")
        }
    }
}

@Model
final class CachedMobileRecord {
    @Attribute(.unique) var cacheKey: String
    var ownerKey: String
    var domainValue: String
    var recordData: Data
    var fetchedAt: Date

    init(ownerKey: String, domain: MobileDomain, record: MobileRecord, fetchedAt: Date = Date()) throws {
        cacheKey = "\(ownerKey):\(domain.rawValue):\(record.id)"
        self.ownerKey = ownerKey
        domainValue = domain.rawValue
        recordData = try JSONEncoder.mobile.encode(record)
        self.fetchedAt = fetchedAt
    }
}

@Model
final class PendingMobileOperation {
    @Attribute(.unique) var operationID: UUID
    var ownerKey: String
    var domainValue: String
    var payload: Data
    var attachmentPath: String?
    var stateValue: String
    var retryCount: Int
    var lastError: String?
    var createdAt: Date

    var domain: MobileDomain { MobileDomain(rawValue: domainValue) ?? .notes }
    var state: PendingState {
        get { PendingState(rawValue: stateValue) ?? .pending }
        set { stateValue = newValue.rawValue }
    }

    init(operationID: UUID, ownerKey: String, domain: MobileDomain, payload: Data, attachmentPath: String? = nil) {
        self.operationID = operationID
        self.ownerKey = ownerKey
        domainValue = domain.rawValue
        self.payload = payload
        self.attachmentPath = attachmentPath
        stateValue = PendingState.pending.rawValue
        retryCount = 0
        createdAt = Date()
    }
}

extension JSONEncoder {
    static var mobile: JSONEncoder {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        return encoder
    }
}
