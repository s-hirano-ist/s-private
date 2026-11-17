#if DEBUG
    import Foundation
    import SPrivateAPI

    // In-memory server for previews and UI tests; never contacts the configured API.
    @MainActor
    final class RssFixtureClient: RssClient {
        static var snapshot: RssSnapshot {
            .init(
                feeds: [
                    .init(
                        id: "fixture-feed", url: "https://example.com/feed", title: "Example Feed", folder: "News",
                        lastFetchedAt: .now)
                ],
                unread: [
                    .init(
                        id: "fixture-unread", feedID: "fixture-feed", url: "https://example.com/article",
                        title: "RSSの記事タイトル — a long title that remains readable across multiple lines")
                ],
                saved: [
                    .init(
                        id: "fixture-saved", url: "https://example.com/saved", title: "Saved article",
                        savedID: "fixture-saved")
                ], fetchedAt: .now)
        }
        var data = snapshot
        func rssPage(_ list: RssList, offset: Int) async throws -> RssPage {
            let entries = list == .unread ? data.unread : data.saved
            return .init(feeds: data.feeds, entries: Array(entries.dropFirst(offset).prefix(50)), count: entries.count)
        }
        func rssSubscribe(url: String, title: String, folder: String) async throws {
            data.feeds.append(.init(id: UUID().uuidString, url: url, title: title, folder: folder, lastFetchedAt: .now))
        }
        func rssUnsubscribe(id: String) async throws {
            data.feeds.removeAll { $0.id == id }
            data.unread.removeAll { $0.feedID == id }
        }
        func rssRead(ids: [String]) async throws { data.unread.removeAll { ids.contains($0.id) } }
        func rssSave(_ entry: RssEntry) async throws {
            let id = UUID().uuidString
            data.saved.insert(
                .init(
                    id: id, url: entry.url, title: entry.title, publishedAt: entry.publishedAt,
                    imageURL: entry.imageURL, savedID: id), at: 0)
            for index in data.unread.indices where data.unread[index].url == entry.url {
                data.unread[index].savedID = id
            }
        }
        func rssUnsave(id: String) async throws {
            data.saved.removeAll { $0.id == id }
            for index in data.unread.indices where data.unread[index].savedID == id { data.unread[index].savedID = nil }
        }
        func rssRefresh(id: String, force: Bool) async throws -> Components.Schemas.RssRefreshResult {
            .init(data: [.init(id: id, changed: false, status: .skipped)])
        }
        func rssImport(_ batch: RssImportBatch) async throws -> Components.Schemas.RssImportResult {
            .init(added: 0, duplicates: 0, invalid: 0)
        }
    }
#endif

#if DEBUG
    import SwiftData
    import SwiftUI

    @MainActor
    private func rssPreview(offline: Bool = false) -> RssReaderModel {
        let container = try! ModelContainer(
            for: CachedRssSnapshot.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
        let model = RssReaderModel(
            cache: .init(container: container), client: RssFixtureClient(), monitorNetwork: false)
        model.configure(owner: "preview", endpoint: "https://example.com/api/v1", signedIn: true)
        model.useFixtures(offline: offline)
        return model
    }

    #Preview("RSS — Unread") { RssReaderView().environment(rssPreview()) }
    #Preview("RSS — Offline") { RssReaderView().environment(rssPreview(offline: true)) }
    #Preview("RSS — Subscriptions") { NavigationStack { RssSubscriptionsView().environment(rssPreview()) } }
#endif
