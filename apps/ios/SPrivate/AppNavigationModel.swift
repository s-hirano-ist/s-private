import Foundation

enum AppTab: Hashable {
    case rss
    case domain(MobileDomain)
}

struct SearchNavigationRequest: Equatable, Sendable {
    let id = UUID()
    let domain: MobileDomain
    let query: String
}

struct RecordNavigationRequest: Equatable, Sendable {
    let id = UUID()
    let domain: MobileDomain
    let recordID: String
}

struct SavedRssNavigationRequest: Equatable, Sendable {
    let id = UUID()
    let query: String
    let readerIdentity: UUID
}

@MainActor
final class AppNavigationModel: ObservableObject, @unchecked Sendable {
    @Published var selectedTab: AppTab = .rss
    @Published private(set) var searchRequest: SearchNavigationRequest?
    @Published private(set) var recordRequest: RecordNavigationRequest?
    @Published private(set) var savedRssRequest: SavedRssNavigationRequest?

    func showSavedRss(_ query: String, readerIdentity: UUID) {
        savedRssRequest = SavedRssNavigationRequest(query: query, readerIdentity: readerIdentity)
        selectedTab = .rss
    }

    func consumeSavedRssRequest(id: UUID) {
        if savedRssRequest?.id == id { savedRssRequest = nil }
    }

    func showSearch(_ query: String, domain: MobileDomain = .notes) {
        selectedTab = .domain(domain)
        searchRequest = SearchNavigationRequest(domain: domain, query: query)
    }

    func open(domain: MobileDomain, recordID: String) {
        selectedTab = .domain(domain)
        recordRequest = RecordNavigationRequest(domain: domain, recordID: recordID)
    }

    func consumeSearchRequest(id: UUID) {
        if searchRequest?.id == id { searchRequest = nil }
    }

    func consumeRecordRequest(id: UUID) {
        if recordRequest?.id == id { recordRequest = nil }
    }

    func open(url: URL) {
        guard url.scheme == "memdex", url.host == "content" else { return }
        let components = url.pathComponents.filter { $0 != "/" }
        guard components.count >= 2, let domain = MobileDomain(rawValue: components[0]) else { return }
        open(domain: domain, recordID: components.dropFirst().joined(separator: "/"))
    }
}
