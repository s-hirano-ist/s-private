import Foundation
import HTTPTypes
import OpenAPIRuntime
import Testing
@testable import SPrivateAPI

private actor StubTransport: ClientTransport {
    let status: Int
    let payload: String
    let contentType: String
    var requests: [HTTPRequest] = []
    var baseURLs: [URL] = []
    init(status: Int, payload: String, contentType: String = "application/json") { self.status = status; self.payload = payload; self.contentType = contentType }
    func send(_ request: HTTPRequest, body: HTTPBody?, baseURL: URL, operationID: String) async throws -> (HTTPResponse, HTTPBody?) {
        requests.append(request)
        baseURLs.append(baseURL)
        return (HTTPResponse(status: .init(code: status), headerFields: [.contentType: contentType]), HTTPBody(payload))
    }
}

struct TransportTests {
    private let serverURL = URL(string: "https://backend.example/api/v1")!

    @Test("Each generated client uses only its own Bearer token")
    func requestAuthentication() async throws {
        let transport = StubTransport(status: 200, payload: #"{"count":3}"#)
        let first = BackendAPI.authenticatedClient(serverURL: serverURL, accessToken: "first", transport: transport)
        let second = BackendAPI.authenticatedClient(serverURL: serverURL, accessToken: "second", transport: transport)
        let output = try await first.countNotes(.init())
        #expect(try output.ok.body.json.count == 3)
        _ = try await second.countNotes(.init())
        _ = try await first.countNotes(.init())
        let requests = await transport.requests
        #expect(requests.map { $0.headerFields[.authorization] } == ["Bearer first", "Bearer second", "Bearer first"])
        #expect(requests.allSatisfy { $0.headerFields[.cookie] == nil && $0.headerFields[.cacheControl] == "no-store" })
        #expect(requests.allSatisfy { $0.path == "/notes/count" })
        #expect(await transport.baseURLs == [serverURL, serverURL, serverURL])
    }

    @Test("Generated error envelopes retain status/code without retrying", arguments: [(401, "UNAUTHORIZED"), (409, "OPERATION_IN_PROGRESS"), (503, "API_UNAVAILABLE")])
    func httpErrors(status: Int, code: String) async throws {
        let transport = StubTransport(status: status, payload: "{\"error\":{\"code\":\"\(code)\"}}")
        let client = BackendAPI.authenticatedClient(serverURL: serverURL, accessToken: "private-token", transport: transport)
        do {
            _ = try await client.countNotes(.init())
            Issue.record("Expected an HTTP failure")
        } catch {
            let failure = try #require(BackendHTTPError.from(error))
            #expect(failure.status == status)
            #expect(failure.code?.rawValue == code)
            #expect(!String(describing: failure).contains("private-token"))
        }
        #expect(await transport.requests.count == 1)
    }

    @Test("Redirects and malformed or oversized error bodies fail closed", arguments: [302, 500])
    func invalidErrorBodies(status: Int) async throws {
        let transport = StubTransport(status: status, payload: String(repeating: "x", count: 20_000))
        let client = BackendAPI.authenticatedClient(serverURL: serverURL, accessToken: "token", transport: transport)
        do {
            _ = try await client.countNotes(.init())
            Issue.record("Expected an HTTP failure")
        } catch {
            let failure = try #require(BackendHTTPError.from(error))
            #expect(failure.status == status)
            #expect(failure.code == nil)
        }
        #expect(await transport.requests.count == 1)
    }

    @Test("Successful JSON is decoded by the generated response contract")
    func invalidSuccess() async throws {
        let transport = StubTransport(status: 200, payload: #"{"count":"invalid"}"#)
        let client = BackendAPI.authenticatedClient(serverURL: serverURL, accessToken: "token", transport: transport)
        await #expect(throws: (any Error).self) { try await client.countNotes(.init()) }
        #expect(await transport.requests.count == 1)
    }
}

struct MediaTransportTests {
    @Test("Generated media client accepts actual server MIME types", arguments: ["image/jpeg", "image/png", "image/webp", "application/octet-stream"])
    func imageContentTypes(contentType: String) async throws {
        let transport = StubTransport(status: 200, payload: "image-bytes", contentType: contentType)
        let client = BackendAPI.authenticatedClient(serverURL: URL(string: "https://backend.example/api/v1")!, accessToken: "token", transport: transport)
        let output = try await client.getMedia(.init(path: .init(domain: .images, id: "image/id", variant: .thumbnail)))
        let body: HTTPBody
        switch try output.ok.body {
        case .binary(let value), .jpeg(let value), .png(let value), .image_webp(let value): body = value
        }
        #expect(try await Data(collecting: body, upTo: 100) == Data("image-bytes".utf8))
        #expect(await transport.requests.first?.path == "/media/images/image%2Fid/thumbnail")
    }
    @Test("HTML success pages cannot masquerade as authenticated media")
    func rejectsHTML() async throws {
        let transport = StubTransport(status: 200, payload: "<html>wrong host</html>", contentType: "text/html")
        let client = BackendAPI.authenticatedClient(serverURL: URL(string: "https://backend.example/api/v1")!, accessToken: "token", transport: transport)
        await #expect(throws: (any Error).self) { try await client.getMedia(.init(path: .init(domain: .books, id: "book", variant: .original))) }
    }
}

struct DateTransportTests {
    @Test("Generated DTOs accept ISO 8601 with and without milliseconds", arguments: ["2026-10-11T01:02:03.123Z", "2026-10-11T01:02:03Z"])
    func dates(timestamp: String) async throws {
        let payload = "{\"id\":\"note\",\"status\":\"UNEXPORTED\",\"createdAt\":\"\(timestamp)\",\"updatedAt\":\"\(timestamp)\",\"title\":\"Title\",\"markdown\":\"Body\"}"
        let transport = StubTransport(status: 200, payload: payload)
        let client = BackendAPI.authenticatedClient(serverURL: URL(string: "https://backend.example/api/v1")!, accessToken: "token", transport: transport)
        let note = try await client.getNotes(.init(path: .init(id: "note"))).ok.body.json
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = timestamp.contains(".") ? [.withInternetDateTime, .withFractionalSeconds] : [.withInternetDateTime]
        #expect(note.updatedAt == formatter.date(from: timestamp))
    }
}
