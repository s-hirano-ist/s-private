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
        private let delayed = ProcessInfo.processInfo.arguments.contains("-ui-testing-rss-delayed")
        private let slowPages = ProcessInfo.processInfo.arguments.contains("-ui-testing-rss-slow-pages")
        init() {
            if delayed {
                data.unread += [
                    .init(id: "fixture-second", feedID: "fixture-feed", url: "https://example.com/second", title: "Second unread article"),
                    .init(id: "fixture-third", feedID: "fixture-feed", url: "https://example.com/third", title: "Third unread article"),
                ]
            }
            if slowPages {
                data.unread += (0..<118).map {
                    .init(id: "fixture-extra-\($0)", feedID: "fixture-feed", url: "https://example.com/extra/\($0)", title: "Extra article \($0)")
                }
            }
        }
        func rssPage(_ list: RssList, offset: Int, snapshotRevision: Int?) async throws -> RssPage {
            if slowPages && offset > 0 { try await Task.sleep(for: .seconds(5)) }
            else if delayed { try await Task.sleep(for: .milliseconds(150)) }
            let entries = list == .unread ? data.unread : data.saved
            return .init(feeds: data.feeds, entries: Array(entries.dropFirst(offset).prefix(50)), count: entries.count, offset: offset)
        }
        func rssSubscribe(url: String, title: String, folder: String) async throws {
            data.feeds.append(.init(id: UUID().uuidString, url: url, title: title, folder: folder, lastFetchedAt: .now))
        }
        func rssUnsubscribe(id: String) async throws {
            data.feeds.removeAll { $0.id == id }
            data.unread.removeAll { $0.feedID == id }
        }
        func rssRead(ids: [String]) async throws {
            if delayed { try await Task.sleep(for: .milliseconds(300)) }
            data.unread.removeAll { ids.contains($0.id) }
        }
        func rssSave(_ entry: RssEntry) async throws -> RssEntry {
            if delayed { try await Task.sleep(for: .milliseconds(300)) }
            if let existing = data.saved.first(where: { $0.url == entry.url }) { return existing }
            let id = UUID().uuidString
            data.saved.insert(
                .init(
                    id: id, url: entry.url, title: entry.title, publishedAt: entry.publishedAt,
                    imageURL: entry.imageURL, savedID: id), at: 0)
            for index in data.unread.indices where data.unread[index].url == entry.url {
                data.unread[index].savedID = id
            }
            return data.saved[0]
        }
        func rssUnsave(id: String) async throws {
            data.saved.removeAll { $0.id == id }
            for index in data.unread.indices where data.unread[index].savedID == id { data.unread[index].savedID = nil }
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
