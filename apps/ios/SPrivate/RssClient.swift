import Foundation
import SPrivateAPI

@MainActor
protocol RssClient: Sendable {
    func rssPage(_ list: RssList, offset: Int, snapshotRevision: Int?) async throws -> RssPage
    func rssSubscribe(url: String, title: String, folder: String) async throws
    func rssUnsubscribe(id: String) async throws
    func rssRead(ids: [String]) async throws
    func rssSave(_ entry: RssEntry) async throws -> RssEntry
    func rssUnsave(id: String) async throws
    func rssImport(_ batch: RssImportBatch) async throws -> Components.Schemas.RssImportResult
}

extension MobileClient {
    private func performRss<T>(_ operation: @MainActor (Client) async throws -> T) async throws -> T {
        let owner = authentication.ownerKey
        return try await perform(whileValid: { self.authentication.ownerKey == owner }, operation)
    }
    func rssPage(_ list: RssList, offset: Int, snapshotRevision: Int?) async throws -> RssPage {
        try await performRss { client in
            let page = try await client.getRssPage(
                .init(query: .init(snapshotRevision: snapshotRevision, view: list == .unread ? .unread : .saved, offset: offset))
            ).ok.body.json
            return RssPage(
                feeds: page.feeds.map(RssFeed.init),
                entries: list == .unread ? page.unread.map(RssEntry.init) : page.saved.map(RssEntry.init),
                count: list == .unread ? page.unreadCount : page.savedCount,
                offset: page.offset, snapshotRevision: page.snapshotRevision)
        }
    }
    func rssSubscribe(url: String, title: String, folder: String) async throws {
        try await performRss {
            _ = try await $0.subscribeRss(.init(body: .json(.init(url: url, title: title, folder: folder)))).ok.body
                .json
        }
    }
    func rssUnsubscribe(id: String) async throws {
        try await performRss { _ = try await $0.unsubscribeRss(.init(path: .init(id: id))).noContent }
    }
    func rssRead(ids: [String]) async throws {
        try await performRss { _ = try await $0.markRssRead(.init(body: .json(.init(ids: ids)))).noContent }
    }
    func rssSave(_ entry: RssEntry) async throws -> RssEntry {
        try await performRss { client in
            let result = try await client.saveRss(.init(body: .json(entry.input))).ok.body.json
            return RssEntry(result.saved)
        }
    }
    func rssUnsave(id: String) async throws {
        try await performRss { _ = try await $0.unsaveRss(.init(path: .init(id: id))).noContent }
    }
    func rssImport(_ batch: RssImportBatch) async throws -> Components.Schemas.RssImportResult {
        try await performRss {
            try await $0.importRss(
                .init(body: .json(.init(kind: batch.kind == .opml ? .opml : .starred, content: batch.content)))
            ).ok.body.json
        }
    }
}
