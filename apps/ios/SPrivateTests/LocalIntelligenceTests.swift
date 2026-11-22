import CoreSpotlight
import Foundation
import Testing
@testable import SPrivate

struct LocalIndexIdentityTests {
    @Test("Spotlight identifiers are stable, owner-scoped, and reversible")
    func stableOwnerScopedIdentifier() throws {
        let first = LocalIndexIdentity(owner: "auth0|private-user", domain: .notes, recordID: "note/42")
        let same = LocalIndexIdentity(owner: "auth0|private-user", domain: .notes, recordID: "note/42")
        let otherOwner = LocalIndexIdentity(owner: "auth0|other-user", domain: .notes, recordID: "note/42")

        #expect(first == same)
        #expect(first.uniqueIdentifier != otherOwner.uniqueIdentifier)
        #expect(!first.uniqueIdentifier.contains("private-user"))
        #expect(LocalIndexIdentity(uniqueIdentifier: first.uniqueIdentifier) == first)
    }

    @Test("Malformed identifiers are rejected")
    func rejectsMalformedIdentifiers() {
        #expect(LocalIndexIdentity(uniqueIdentifier: "notes|missing-owner") == nil)
        #expect(LocalIndexIdentity(uniqueIdentifier: "digest|unknown|record") == nil)
    }
}

struct SpotlightSnapshotEntryTests {
    @Test("A snapshot preserves searchable text and a local deep link")
    func mapsSearchAttributes() throws {
        let entry = SpotlightSnapshotEntry(
            uniqueIdentifier: "owner|notes|note-1",
            domainIdentifier: "owner",
            contentTypeIdentifier: "public.plain-text",
            title: "Local note",
            textContent: "Private searchable body",
            contentDescription: "Private summary",
            keywords: ["notes", "local"],
            createdAt: Date(timeIntervalSince1970: 1_700_000_000),
            modifiedAt: Date(timeIntervalSince1970: 1_700_000_100),
            contentURL: try #require(URL(string: "memdex://content/notes/note-1"))
        )

        let item = entry.searchableItem
        #expect(item.uniqueIdentifier == entry.uniqueIdentifier)
        #expect(item.domainIdentifier == entry.domainIdentifier)
        #expect(item.attributeSet.title == "Local note")
        #expect(item.attributeSet.textContent == "Private searchable body")
        #expect(item.attributeSet.contentURL == entry.contentURL)
    }
}

@MainActor
struct LocalIntelligenceNavigationTests {
    @Test("A Memdex deep link opens the matching domain and record")
    func opensDeepLink() throws {
        let navigation = AppNavigationModel()
        navigation.open(url: try #require(URL(string: "memdex://content/books/book%2F42")))

        #expect(navigation.selectedTab == .domain(.books))
        #expect(navigation.recordRequest?.domain == .books)
        #expect(navigation.recordRequest?.recordID == "book/42")
    }

    @Test("Unrelated URL schemes are ignored")
    func ignoresUnrelatedURL() throws {
        let navigation = AppNavigationModel()
        navigation.open(url: try #require(URL(string: "https://example.com/content/notes/1")))

        #expect(navigation.selectedTab == .rss)
        #expect(navigation.recordRequest == nil)
    }
}
