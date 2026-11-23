import Foundation
import HTTPTypes
import OpenAPIRuntime
import SPrivateAPI
import Testing
@testable import SPrivate

private actor APIStub: ClientTransport {
    struct Capture: Sendable { let path: String?; let body: Data }
    var responses: [(Int, Data)]
    var requests: [Capture] = []
    init(_ responses: [(Int, Data)]) { self.responses = responses }
    func send(_ request: HTTPRequest, body: HTTPBody?, baseURL: URL, operationID: String) async throws -> (HTTPResponse, HTTPBody?) {
        let data = try await body.mapData()
        requests.append(Capture(path: request.path, body: data))
        guard !responses.isEmpty else { throw URLError(.badServerResponse) }
        let (status, payload) = responses.removeFirst()
        return (HTTPResponse(status: .init(code: status), headerFields: [.contentType: "application/json"]), HTTPBody(payload))
    }
}
private extension Optional where Wrapped == HTTPBody {
    func mapData() async throws -> Data {
        guard let body = self else { return Data() }
        return try await Data(collecting: body, upTo: MobileClient.imageLimit + 1024)
    }
}

@MainActor
struct BackendClientTests {
    private let operationID = UUID(uuidString: "ABCDEF00-0000-4000-8000-000000000001")!
    private func client(_ stub: APIStub) -> MobileClient {
        MobileClient(authentication: AuthenticationModel(), client: BackendAPI.authenticatedClient(serverURL: URL(string: "https://backend.example/api/v1")!, accessToken: "test", transport: stub))
    }
    private func result(_ domain: Components.Schemas.ContentDomain, accepted: Bool = true) throws -> Data {
        try JSONEncoder().encode(Components.Schemas.CreateResult(accepted: accepted, operationId: operationID.uuidString, resource: .init(id: "created", _type: domain)))
    }
    private func upload(_ received: [Int]) throws -> Data {
        try JSONEncoder.mobile.encode(Components.Schemas.UploadSession(uploadId: "upload", operationId: operationID.uuidString, chunkSize: ._1048576, receivedParts: received, expiresAt: Date().addingTimeInterval(3600)))
    }

    @Test("Creates use generated domain-specific bodies and keep the stored UUID representation")
    func creates() async throws {
        let stub = APIStub([(201, try result(.articles)), (201, try result(.notes))])
        let api = client(stub)
        try await api.create(.articles, input: .init(operationId: operationID, title: "Article", url: "https://example.com", category: "News"))
        try await api.create(.notes, input: .init(operationId: operationID, title: "Note", markdown: "Body"))
        let requests = await stub.requests
        #expect(requests.map(\.path) == ["/articles", "/notes"])
        let article = try JSONDecoder().decode(Components.Schemas.ArticleCreate.self, from: requests[0].body)
        let note = try JSONDecoder().decode(Components.Schemas.NoteCreate.self, from: requests[1].body)
        #expect(article.operationId == operationID.uuidString)
        #expect(article.category == "News")
        #expect(note.markdown == "Body")
    }

    @Test("Book upload keeps raw CSV segments and skips already received chunks")
    func bookUpload() async throws {
        let stub = APIStub([(200, try upload([0])), (200, Data(#"{"accepted":true,"part":1}"#.utf8)), (200, Data(#"{"accepted":true,"part":2}"#.utf8)), (201, try result(.books))])
        try await client(stub).chunkedUpload(.books, operationId: operationID, image: Data(repeating: 7, count: 2 * 1_048_576 + 17), fields: ["isbn":"9781234567890", "title":"Book", "rating":"4", "tags":" a , b, "])
        let requests = await stub.requests
        #expect(requests.map(\.path) == ["/uploads", "/uploads/upload/chunks/1", "/uploads/upload/chunks/2", "/uploads/upload/complete"])
        let start = try JSONDecoder().decode(Components.Schemas.UploadStart.self, from: requests[0].body)
        guard case .books(let book) = start else { Issue.record("Expected a book upload"); return }
        #expect(book.operationId == operationID.uuidString)
        #expect(book.metadata.rating == 4)
        #expect(book.metadata.tags.joined(separator: ",") == " a , b, ")
        #expect(requests[1].body.count == 1_048_576)
        #expect(requests[2].body.count == 17)
    }

    @Test("A failed chunk is not retried automatically; explicit retry resumes the same operation")
    func resumes() async throws {
        let stub = APIStub([(200, try upload([])), (200, Data(#"{"accepted":true,"part":0}"#.utf8)), (503, Data(#"{"error":{"code":"API_UNAVAILABLE"}}"#.utf8)), (200, try upload([0])), (200, Data(#"{"accepted":true,"part":1}"#.utf8)), (201, try result(.images))])
        let api = client(stub)
        let bytes = Data(repeating: 1, count: 1_048_576 + 17)
        do { try await api.chunkedUpload(.images, operationId: operationID, image: bytes, fields: [:]); Issue.record("Expected a chunk failure") }
        catch MobileClientError.http(503, "API_UNAVAILABLE") { }
        #expect(await stub.requests.count == 3)
        try await api.chunkedUpload(.images, operationId: operationID, image: bytes, fields: [:])
        let requests = await stub.requests
        #expect(requests[0].body == requests[3].body)
        #expect(requests.map(\.path) == ["/uploads", "/uploads/upload/chunks/0", "/uploads/upload/chunks/1", "/uploads", "/uploads/upload/chunks/1", "/uploads/upload/complete"])
    }

    @Test("A false success cannot remove a queued create")
    func rejectsFalseSuccess() async throws {
        let stub = APIStub([(201, try result(.notes, accepted: false))])
        do { try await client(stub).create(.notes, input: .init(operationId: operationID, title: "Note", markdown: "Body")); Issue.record("Expected a false success rejection") }
        catch MobileClientError.invalidResponse { }
        #expect(await stub.requests.count == 1)
    }

    @Test("Snapshot mapping rejects a different domain and preserves cached dates")
    func snapshotMapping() throws {
        let date = Date(timeIntervalSince1970: 1_700_000_000.123)
        let note = Components.Schemas.Note(id: "note", status: .LAST_UPDATED, createdAt: date, updatedAt: date, title: "Title", markdown: "Body")
        let snapshot = Components.Schemas.SnapshotRecord.notes(.init(domain: .notes, record: note))
        let mapped = try MobileRecord(snapshot: snapshot, expected: .notes)
        #expect(mapped.updatedAt == date)
        #expect(mapped.status == .lastUpdated)
        #expect(mapped.markdown == "Body")
        #expect(throws: MobileClientError.self) { try MobileRecord(snapshot: snapshot, expected: .articles) }
    }

    @Test("Article metadata survives snapshot and delta mapping and cache encoding")
    func articleMetadataMapping() throws {
        let date = Date(timeIntervalSince1970: 1_700_000_000)
        let article = Components.Schemas.Article(
            id: "article", status: .EXPORTED, createdAt: date, updatedAt: date,
            title: "Saved title", url: "https://example.com/article", categoryId: "news", categoryName: "News",
            ogImageUrl: "https://example.com/cover.jpg", ogTitle: "Page title", ogDescription: "Page overview"
        )
        let snapshot = Components.Schemas.SnapshotRecord.articles(.init(domain: .articles, record: article))
        let upsert = Components.Schemas.SyncChange.upsert(.init(id: article.id, version: "2", action: .upsert, value: snapshot))
        let deltaRecord = try #require(MobileSyncChange(upsert).record)
        for record in [try MobileRecord(snapshot: snapshot, expected: .articles), deltaRecord] {
            let cached = try MobileAPICoding.decoder().decode(MobileRecord.self, from: JSONEncoder.mobile.encode(record))
            #expect(cached.title == article.title)
            #expect(cached.ogTitle == article.ogTitle)
            #expect(cached.ogDescription == article.ogDescription)
            #expect(cached.ogImageUrl == article.ogImageUrl)
        }
    }

    @Test("Generated sync changes retain version strings and category/delete discriminators")
    func changesMapping() throws {
        let category = Components.Schemas.SyncChange.upsert(.init(id: "category", version: "9007199254740993", action: .upsert, value: .categories(.init(domain: .categories, record: .init(id: "category", name: "News")))))
        let mapped = MobileSyncChange(category)
        #expect(mapped.version == "9007199254740993")
        #expect(mapped.domain == "categories")
        #expect(mapped.category?.name == "News")
        #expect(mapped.record == nil)
        let deleted = MobileSyncChange(.delete(.init(id: "note", version: "9007199254740994", action: .delete, domain: .notes)))
        #expect(deleted.action == "delete")
        #expect(deleted.domain == "notes")
        #expect(deleted.record == nil)
    }
    @Test("RSS uses the generated contracts for list, save, read, subscriptions and import")
    func rssContracts() async throws {
        let page = Data(#"{"snapshotRevision":7,"newerCount":2,"offset":50,"feeds":[{"id":"feed","url":"https://example.com/rss","title":"News","folder":"Tech","lastFetchedAt":null,"error":null}],"unread":[{"id":"entry","feedId":"feed","url":"https://example.com/entry","title":"Article","publishedAt":null,"receivedAt":"2026-11-17T00:00:00.000Z","imageUrl":"https://example.com/image.jpg","savedId":"saved"}],"saved":[],"unreadCount":51,"savedCount":0}"#.utf8)
        let added = Data(#"{"added":true}"#.utf8)
        let saveResult = Data(#"{"added":true,"saved":{"id":"saved","url":"https://example.com/entry","title":"Article","publishedAt":null,"savedAt":"2026-11-18T00:00:00Z"}}"#.utf8)
        let stub = APIStub([(200, page), (200, saveResult), (204, Data()), (204, Data()), (200, added), (204, Data()), (200, Data(#"{"added":1,"duplicates":2,"invalid":3}"#.utf8))])
        let api = client(stub)
        let result = try await api.rssPage(.unread, offset: 50, snapshotRevision: 7)
        #expect(result.count == 51)
        #expect(result.feeds.first?.folder == "Tech")
        let entry = try #require(result.entries.first)
        #expect(entry.savedID == "saved")
        let stored = try await api.rssSave(entry)
        #expect(stored.savedID == "saved")
        #expect(result.snapshotRevision == 7)
        #expect(result.offset == 50)
        try await api.rssRead(ids: [entry.id])
        try await api.rssUnsave(id: "saved")
        try await api.rssSubscribe(url: "https://example.com/rss", title: "News", folder: "Tech")
        try await api.rssUnsubscribe(id: "feed")
        let imported = try await api.rssImport(.init(kind: .opml, content: "<opml/>"))
        #expect(imported.duplicates == 2)
        let requests = await stub.requests
        #expect(requests[0].path?.contains("view=unread") == true)
        #expect(requests[0].path?.contains("offset=50") == true)
        #expect(requests[0].path?.contains("snapshotRevision=7") == true)
        #expect(requests.dropFirst().map(\.path) == ["/rss/saved", "/rss/read", "/rss/saved/saved", "/rss/feeds", "/rss/feeds/feed", "/rss/import"])
        let saved = try JSONDecoder().decode(Components.Schemas.RssEntryInput.self, from: requests[1].body)
        #expect(saved.imageUrl == "https://example.com/image.jpg")
        let read = try JSONDecoder().decode(Components.Schemas.RssReadInput.self, from: requests[2].body)
        #expect(read.ids == ["entry"])
    }

    @Test("An RSS mutation with an ambiguous failure is sent only once")
    func rssAmbiguousResponse() async throws {
        let stub = APIStub([(503, Data(#"{"error":{"code":"API_UNAVAILABLE"}}"#.utf8))])
        do { try await client(stub).rssRead(ids: ["entry"]); Issue.record("Expected a failure") }
        catch MobileClientError.http(503, "API_UNAVAILABLE") { }
        #expect(await stub.requests.count == 1)
    }

    @Test("An expired RSS request cannot sign out the current session after an old 401")
    func staleRequestAuthenticationFailure() async throws {
        let stub = APIStub([(401, Data(#"{"error":{"code":"UNAUTHORIZED"}}"#.utf8))])
        let api = client(stub)
        let previous = api.authentication.status
        var valid = true
        do {
            _ = try await api.perform(whileValid: { valid }) { client in
                valid = false
                return try await client.getRssPage(.init()).ok.body.json
            }
            Issue.record("Expected cancellation")
        } catch is CancellationError {}
        #expect(api.authentication.status == previous)
        #expect(await stub.requests.count == 1)
    }

    @Test("An expired request is rejected before any HTTP mutation is sent")
    func expiredRequestBeforeSend() async throws {
        let stub = APIStub([])
        let api = client(stub)
        do {
            try await api.perform(whileValid: { false }) { client in
                _ = try await client.markRssRead(.init(body: .json(.init(ids: ["entry"])))).noContent
            }
            Issue.record("Expected cancellation")
        } catch is CancellationError {}
        #expect(await stub.requests.isEmpty)
    }

}
