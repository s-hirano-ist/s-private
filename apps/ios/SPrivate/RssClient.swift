import Foundation
import SPrivateAPI

@MainActor
protocol RssClient: Sendable {
    func rssPage(_ list: RssList, offset: Int) async throws -> RssPage
    func rssSubscribe(url: String, title: String, folder: String) async throws
    func rssUnsubscribe(id: String) async throws
    func rssRead(ids: [String]) async throws
    func rssSave(_ entry: RssEntry) async throws
    func rssUnsave(id: String) async throws
    func rssRefresh(id: String, force: Bool) async throws -> Components.Schemas.RssRefreshResult
    func rssImport(_ batch: RssImportBatch) async throws -> Components.Schemas.RssImportResult
}

extension MobileClient {
    func rssPage(_ list: RssList, offset: Int) async throws -> RssPage {
        try await perform { client in
            let page = try await client.getRssPage(
                .init(query: .init(view: list == .unread ? .unread : .saved, offset: offset))
            ).ok.body.json
            return RssPage(
                feeds: page.feeds.map(RssFeed.init),
                entries: list == .unread ? page.unread.map(RssEntry.init) : page.saved.map(RssEntry.init),
                count: list == .unread ? page.unreadCount : page.savedCount)
        }
    }
    func rssSubscribe(url: String, title: String, folder: String) async throws {
        try await perform {
            _ = try await $0.subscribeRss(.init(body: .json(.init(url: url, title: title, folder: folder)))).ok.body
                .json
        }
    }
    func rssUnsubscribe(id: String) async throws {
        try await perform { _ = try await $0.unsubscribeRss(.init(path: .init(id: id))).noContent }
    }
    func rssRead(ids: [String]) async throws {
        try await perform { _ = try await $0.markRssRead(.init(body: .json(.init(ids: ids)))).noContent }
    }
    func rssSave(_ entry: RssEntry) async throws {
        try await perform { _ = try await $0.saveRss(.init(body: .json(entry.input))).ok.body.json }
    }
    func rssUnsave(id: String) async throws {
        try await perform { _ = try await $0.unsaveRss(.init(path: .init(id: id))).noContent }
    }
    func rssRefresh(id: String, force: Bool) async throws -> Components.Schemas.RssRefreshResult {
        try await perform { try await $0.refreshRss(.init(body: .json(.init(ids: [id], force: force)))).ok.body.json }
    }
    func rssImport(_ batch: RssImportBatch) async throws -> Components.Schemas.RssImportResult {
        try await perform {
            try await $0.importRss(
                .init(body: .json(.init(kind: batch.kind == .opml ? .opml : .starred, content: batch.content)))
            ).ok.body.json
        }
    }
}
