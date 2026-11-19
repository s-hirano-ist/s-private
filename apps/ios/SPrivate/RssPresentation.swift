import Foundation

// Rebuilt only for data/filter/acceptance changes, independently of polling progress.
struct RssPresentation: Sendable {
    var entries: [RssEntry] = []
    var newCount = 0
    var sources: [String: String] = [:]

    init() {}
    init(snapshot: RssSnapshot, list: RssList, feedID: String, acceptedIDs: Set<String>, initialized: Bool) {
        sources = Dictionary(snapshot.feeds.map { ($0.id, $0.title) }, uniquingKeysWith: { first, _ in first })
        if list == .saved { entries = snapshot.saved; return }
        entries.reserveCapacity(snapshot.unread.count)
        for entry in snapshot.unread where feedID.isEmpty || entry.feedID == feedID {
            if !initialized || acceptedIDs.contains(entry.id) { entries.append(entry) }
            else { newCount += 1 }
        }
    }
}
