import Foundation
import Testing

@testable import SPrivate

struct RssSavedSearchTests {
    @Test func searchesNormalizedTitleAndURLInSavedOrder() {
        let saved = [
            entry("Ｆｏｏ とＳｗｉｆｔＵＩ", id: "one", path: "guide"),
            entry("SwiftUI ガイド", id: "two", path: "GUIDE"),
            entry("SwiftUI の紹介", id: "three", path: "intro"),
        ]
        let filter = RssSavedFilter(query: " swiftui　Guide ")

        #expect(filter.apply(to: saved).map(\.id) == ["one", "two"])
        #expect(RssSavedFilter(query: "  ").apply(to: saved) == saved)
    }

    @Test func classifiesTitlesWithoutSubscriptionMetadata() {
        let saved = [
            entry("SwiftUIで睡眠を記録", id: "multi"),
            entry("映画レビュー", id: "culture"),
            entry("Paint the wall", id: "other"),
        ]

        #expect(RssSavedFilter(topic: .technology).apply(to: saved).map(\.id) == ["multi"])
        #expect(RssSavedFilter(topic: .lifestyle).apply(to: saved).map(\.id) == ["multi"])
        #expect(RssSavedFilter(topic: .culture).apply(to: saved).map(\.id) == ["culture"])
        #expect(RssSavedFilter(topic: .uncategorized).apply(to: saved).map(\.id) == ["other"])
        #expect(RssSavedFilter(query: "記録 example.com", topic: .technology).apply(to: saved).map(\.id) == ["multi"])
        #expect(RssSavedFilter(query: "映画", topic: .technology).apply(to: saved).isEmpty)
    }

    @Test func usesAlternativeSearchTermsWithinSelectedTopic() async throws {
        let saved = [
            entry("SwiftUI development", id: "one"),
            entry("iOS ソフトウェア開発", id: "two"),
            entry("音楽の開発", id: "three"),
        ]
        let result = try await RssSavedFilter.resolve(" iOSアプリの開発記事を探して ") { input in
            #expect(input == "iOSアプリの開発記事を探して")
            return RssSavedFilter(topic: .technology, alternatives: ["development", "開発"])
        }

        #expect(!result.usedManualSearch)
        #expect(result.filter.apply(to: saved).map(\.id) == ["one", "two"])
    }

    @Test func fallsBackWhenTheModelIsUnavailableOrProducesNoConditions() async throws {
        let unavailable = try await RssSavedFilter.resolve(" SwiftUI ") { _ in nil }
        let empty = try await RssSavedFilter.resolve(" SwiftUI ") { _ in RssSavedFilter() }
        let failed = try await RssSavedFilter.resolve(" SwiftUI ") { _ in throw URLError(.unknown) }

        for result in [unavailable, empty, failed] {
            #expect(result.usedManualSearch)
            #expect(result.filter == RssSavedFilter(query: "SwiftUI"))
        }
    }

    @Test func cancelledSearchCannotApplyItsResult() async {
        let task = Task {
            try await RssSavedFilter.resolve("SwiftUI") { _ in
                try await Task.sleep(for: .seconds(30))
                return RssSavedFilter(topic: .technology)
            }
        }
        task.cancel()
        await #expect(throws: CancellationError.self) { try await task.value }
    }

    @Test @MainActor func navigationRequestSelectsRSSAndCanOnlyConsumeTheCurrentRequest() throws {
        let navigation = AppNavigationModel()
        let identity = UUID()
        navigation.selectedTab = .domain(.notes)
        navigation.showSavedRss("first", readerIdentity: identity)
        let first = try #require(navigation.savedRssRequest)
        navigation.showSavedRss("second", readerIdentity: identity)
        let second = try #require(navigation.savedRssRequest)
        navigation.consumeSavedRssRequest(id: first.id)
        #expect(navigation.selectedTab == .rss)
        #expect(navigation.savedRssRequest == second)
        #expect(second.readerIdentity == identity)
        navigation.consumeSavedRssRequest(id: second.id)
        #expect(navigation.savedRssRequest == nil)
    }

    private func entry(_ title: String, id: String, path: String? = nil) -> RssEntry {
        RssEntry(id: id, url: "https://example.com/\(path ?? id)", title: title, savedID: id)
    }
}
