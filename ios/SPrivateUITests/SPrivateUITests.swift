import XCTest

final class SPrivateUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    func testUnconfiguredAuth0AndEmptyInboxAreVisible() throws {
        let app = XCUIApplication()
        app.launch()

        XCTAssertTrue(
            app.staticTexts["auth0-unconfigured-message"].waitForExistence(timeout: 5)
        )
        XCTAssertTrue(
            app.staticTexts["共有項目はありません"].waitForExistence(timeout: 5)
        )
    }
}
