import Foundation
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
