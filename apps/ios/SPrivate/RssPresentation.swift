import Foundation

// Rebuilt only for data/filter/acceptance changes, independently of polling progress.
struct RssPresentation: Sendable {
    var entries: [RssEntry] = []
    var newCount = 0
    var unreadCount = 0
    var unreadCounts: [String: Int] = [:]
    var sources: [String: String] = [:]

    init() {}
    init(snapshot: RssSnapshot, list: RssList, feedID: String, acceptedIDs: Set<String>, initialized: Bool,
         unreadQuery: String = "", savedFilter: RssSavedFilter = .init()) {
        sources = Dictionary(snapshot.feeds.map { ($0.id, $0.title) }, uniquingKeysWith: { first, _ in first })
        if list == .saved { entries = savedFilter.apply(to: snapshot.saved) }
        let keywords = RssKeywordQuery(unreadQuery)
        entries.reserveCapacity(max(entries.count, snapshot.unread.count))
        for entry in snapshot.unread {
            let accepted = !initialized || acceptedIDs.contains(entry.id)
            if accepted {
                unreadCount += 1
                if let feedID = entry.feedID { unreadCounts[feedID, default: 0] += 1 }
            }
            guard list == .unread, feedID.isEmpty || entry.feedID == feedID, keywords.matches(entry) else { continue }
            if accepted { entries.append(entry) }
            else { newCount += 1 }
        }
    }
}
