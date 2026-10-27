import Foundation
import Testing
@testable import SPrivateAPI

struct ContractTests {
    @Test("Generated models preserve domain and action discriminators")
    func syncDiscriminators() throws {
        let data = Data(#"{"id":"category-1","version":"9007199254740993","action":"upsert","value":{"domain":"categories","record":{"id":"category-1","name":"Category"}}}"#.utf8)
        let value = try JSONDecoder().decode(Components.Schemas.SyncChange.self, from: data)
        guard case .upsert(let upsert) = value, case .categories(let category) = upsert.value else {
            Issue.record("Expected a category upsert")
            return
        }
        #expect(category.record.name == "Category")
        #expect(upsert.version == "9007199254740993")
    }

    @Test("A record from the wrong domain cannot decode as an article")
    func wrongDomain() {
        let data = Data(#"{"domain":"articles","record":{"id":"note-1","title":"Note","markdown":"Body"}}"#.utf8)
        #expect(throws: (any Error).self) {
            try JSONDecoder().decode(Components.Schemas.SnapshotRecord.self, from: data)
        }
    }

    @Test("Unknown domain discriminators are rejected")
    func unknownDomain() {
        let data = Data(#"{"domain":"unknown","record":{}}"#.utf8)
        #expect(throws: (any Error).self) {
            try JSONDecoder().decode(Components.Schemas.SnapshotRecord.self, from: data)
        }
    }
    @Test("Book upload input preserves ISBN and tags before backend normalization")
    func uploadInput() throws {
        let data = Data(#"{"operationId":"6ab4a998-177a-4a34-ae38-9f5e75a05b2c","domain":"books","contentType":"image/jpeg","fileSize":100,"metadata":{"isbn":"978-4-06-521234-5","title":"Book","rating":5,"tags":["  tag  "," "]}}"#.utf8)
        let value = try JSONDecoder().decode(Components.Schemas.UploadStart.self, from: data)
        let encoded = try JSONEncoder().encode(value)
        let object = try #require(JSONSerialization.jsonObject(with: encoded) as? [String: Any])
        let metadata = try #require(object["metadata"] as? [String: Any])
        #expect(metadata["isbn"] as? String == "978-4-06-521234-5")
        #expect(metadata["tags"] as? [String] == ["  tag  ", " "])
    }
}
