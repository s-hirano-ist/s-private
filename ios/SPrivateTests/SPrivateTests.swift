import Testing
@testable import SPrivate

struct SPrivateTests {
    @Test("The sample app test target is configured")
    func appTargetIsAvailable() {
        #expect(ContentView.self == ContentView.self)
    }
}
