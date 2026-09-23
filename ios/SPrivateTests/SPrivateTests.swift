import Foundation
import Security
import SwiftData
import Testing
@testable import SPrivate

struct SharedInboxStoreTests {
    @Test("Shared items are saved atomically and imported once")
    func savesAndImportsOnce() throws {
        let containerURL = temporaryDirectory()
        defer { try? FileManager.default.removeItem(at: containerURL) }
        let store = try SharedInboxStore(containerURL: containerURL)
        let item = SharedInboxItem(
            operationID: UUID(),
            kind: .image,
            text: "shared image",
            attachmentRelativePath: "attachments/image.jpg",
            createdAt: Date(timeIntervalSince1970: 1_700_000_000)
        )

        try store.save(item, attachmentData: Data([0x01, 0x02]))

        let rootContents = try FileManager.default.contentsOfDirectory(
            at: containerURL.appending(path: "SharedInbox"),
            includingPropertiesForKeys: nil
        )
        #expect(!rootContents.contains { $0.lastPathComponent.hasPrefix(".tmp-") })
        let firstImport = try store.importPending()
        let secondImport = try store.importPending()
        let loadedItems = try store.loadImported()
        #expect(firstImport == [item])
        #expect(secondImport.isEmpty)
        #expect(loadedItems == [item])
    }

    @Test("An operation ID cannot be stored twice")
    func rejectsDuplicateOperationID() throws {
        let containerURL = temporaryDirectory()
        defer { try? FileManager.default.removeItem(at: containerURL) }
        let store = try SharedInboxStore(containerURL: containerURL)
        let item = SharedInboxItem(kind: .text, text: "duplicate")
        try store.save(item)

        do {
            try store.save(item)
            Issue.record("Expected duplicate operation to fail")
        } catch let error as SharedInboxStoreError {
            #expect(error == .duplicateOperation(item.operationID))
        }
    }

    @Test("Corrupted metadata is rejected")
    func rejectsCorruptedMetadata() throws {
        let containerURL = temporaryDirectory()
        defer { try? FileManager.default.removeItem(at: containerURL) }
        let store = try SharedInboxStore(containerURL: containerURL)
        let corruptedURL = containerURL
            .appending(path: "SharedInbox/Pending/corrupted", directoryHint: .isDirectory)
        try FileManager.default.createDirectory(at: corruptedURL, withIntermediateDirectories: true)
        try Data("not-json".utf8).write(to: corruptedURL.appending(path: "item.json"))

        #expect(throws: DecodingError.self) {
            try store.importPending()
        }
    }

    private func temporaryDirectory() -> URL {
        let url = FileManager.default.temporaryDirectory
            .appending(path: UUID().uuidString, directoryHint: .isDirectory)
        try? FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        return url
    }
}

struct Auth0ConfigurationTests {
    @Test("Empty Auth0 values are reported as unconfigured")
    func detectsMissingConfiguration() {
        let configuration = Auth0Configuration(
            clientID: "",
            domain: "",
            audience: "",
            bundleIdentifier: "ist.s-hirano.s-private"
        )

        #expect(!configuration.isConfigured)
        #expect(configuration.callbackURL == nil)
    }

    @Test("Only the configured custom-scheme callback is accepted")
    func validatesCallbackURL() throws {
        let configuration = Auth0Configuration(
            clientID: "client-id",
            domain: "example.jp.auth0.com",
            audience: "https://example.invalid/mobile",
            bundleIdentifier: "ist.s-hirano.s-private"
        )
        let callbackURL = try #require(configuration.callbackURL)

        #expect(configuration.isConfigured)
        #expect(configuration.acceptsCallbackURL(callbackURL))
        #expect(
            !configuration.acceptsCallbackURL(
                try #require(URL(string: "other-app://example.jp.auth0.com/ios/ist.s-hirano.s-private/callback"))
            )
        )
    }
}

struct MobileAPIContractTests {
    @Test("Article pages decode string IDs and ISO 8601 dates")
    func decodesArticlePage() throws {
        let payload = Data(#"{"data":[{"id":"article-1","title":"Example","url":"https://example.com","quote":null,"categoryId":"category-1","categoryName":"News","status":"UNEXPORTED","createdAt":"2026-09-21T01:02:03.000Z","updatedAt":"2026-09-21T01:02:03.000Z","exportedAt":null}],"totalCount":1,"offset":0,"limit":30}"#.utf8)
        let page = try MobileAPICoding.decoder().decode(MobilePage<MobileArticle>.self, from: payload)
        #expect(page.data.first?.id == "article-1")
        #expect(page.data.first?.status == .unexported)
        #expect(page.totalCount == 1)
    }

    @Test("Stable API error codes decode without localized messages")
    func decodesError() throws {
        let payload = Data(#"{"error":{"code":"UNAUTHORIZED"}}"#.utf8)
        let envelope = try MobileAPICoding.decoder().decode(MobileAPIErrorEnvelope.self, from: payload)
        #expect(envelope.error.code == "UNAUTHORIZED")
    }

    @Test("All four domain records decode from the mobile API")
    func decodesDomainRecords() throws {
        let base = #""id":"one","status":"UNEXPORTED","createdAt":"2026-09-21T01:02:03Z","updatedAt":"2026-09-21T01:02:03Z""#
        let fixtures = [
            "{\(base),\"title\":\"Article\",\"url\":\"https://example.com\",\"categoryId\":\"c\",\"categoryName\":\"News\"}",
            "{\(base),\"title\":\"Note\",\"markdown\":\"# Heading\"}",
            "{\(base),\"path\":\"image.jpg\",\"contentType\":\"image/jpeg\"}",
            "{\(base),\"title\":\"Book\",\"isbn\":\"123\",\"rating\":3,\"tags\":[\"swift\"]}",
        ]
        for fixture in fixtures {
            let record = try MobileAPICoding.decoder().decode(MobileRecord.self, from: Data(fixture.utf8))
            #expect(record.id == "one")
        }
    }

    @Test("Create JSON omits fields for other domains")
    func createPayloadIsDomainSpecific() throws {
        let input = MobileCreate(operationId: UUID(), title: "Note", url: nil, category: nil, quote: nil, markdown: "text")
        let object = try #require(JSONSerialization.jsonObject(with: JSONEncoder().encode(input)) as? [String: Any])
        #expect(object["markdown"] as? String == "text")
        #expect(object["url"] == nil)
        #expect(object["category"] == nil)
    }

    @Test("An upload rejects images over ten MiB before authentication")
    @MainActor
    func rejectsLargeUpload() async {
        let client = MobileClient(authentication: AuthenticationModel())
        do {
            try await client.chunkedUpload(.images, operationId: UUID(), image: Data(count: MobileClient.imageLimit + 1), fields: [:])
            Issue.record("Expected upload size rejection")
        } catch MobileClientError.uploadTooLarge {
            // Expected.
        } catch {
            Issue.record("Unexpected error: \(error)")
        }
    }
}

struct NativeMarkdownParserTests {
    @Test("Markdown blocks render with native headings, lists, tables, code and images")
    func parsesNativeBlocks() {
        let source = "# Heading\n- one\n- two\n| A | B |\n| --- | --- |\n| 1 | 2 |\n```swift\nlet n = 1\n```\n![alt](https://example.com/image.png)"
        let blocks = NativeMarkdownParser.parse(source)
        #expect(blocks.count == 5)
        if case let .table(rows) = blocks[2].kind { #expect(rows.count == 2) }
        else { Issue.record("Expected table") }
    }
}

@MainActor
struct OfflineQueueTests {
    @Test("Pending operations survive a new coordinator and cache deletion")
    func persistsPendingOperations() throws {
        let configuration = ModelConfiguration(isStoredInMemoryOnly: true)
        let container = try ModelContainer(
            for: CachedMobileRecord.self,
            PendingMobileOperation.self,
            configurations: configuration
        )
        let authentication = AuthenticationModel()
        let first = SyncCoordinator(container: container, authentication: authentication)
        let operationID = UUID()
        try first.enqueue(
            domain: .notes,
            input: MobileCreate(operationId: operationID, title: "Offline", markdown: "Body")
        )
        first.clearCache()

        let restored = SyncCoordinator(container: container, authentication: authentication)
        #expect(restored.pendingOperations().map(\.operationID) == [operationID])
    }

    @Test("Cancelling a pending operation removes it")
    func cancelsPendingOperation() throws {
        let container = try ModelContainer(
            for: CachedMobileRecord.self,
            PendingMobileOperation.self,
            configurations: ModelConfiguration(isStoredInMemoryOnly: true)
        )
        let coordinator = SyncCoordinator(container: container, authentication: AuthenticationModel())
        try coordinator.enqueue(
            domain: .articles,
            input: MobileCreate(operationId: UUID(), title: "Link", url: "https://example.com", category: "Shared")
        )
        let pending = try #require(coordinator.pendingOperations().first)
        coordinator.cancel(pending)
        #expect(coordinator.pendingOperations().isEmpty)
    }
}

struct SimulatorEntitlementTests {
    @Test("App Group and default Keychain are available to the installed app")
    func appCapabilities() throws {
        #expect(FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: "group.ist.s-hirano.s-private"
        ) != nil)

        let account = UUID().uuidString
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: "ist.s-hirano.s-private.entitlement-test",
            kSecAttrAccount as String: account,
            kSecValueData as String: Data("test".utf8),
        ]
        let status = SecItemAdd(query as CFDictionary, nil)
        defer { SecItemDelete(query as CFDictionary) }
        #expect(status == errSecSuccess)
    }
}
