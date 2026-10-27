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
}
