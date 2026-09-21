import XCTest

final class SPrivateUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    func testAuth0StatusAndEmptyInboxAreVisible() throws {
        let app = XCUIApplication()
        app.launch()

        let unconfiguredMessage = app.staticTexts["auth0-unconfigured-message"]
        if !unconfiguredMessage.waitForExistence(timeout: 1) {
            XCTAssertTrue(app.buttons["Auth0でログイン"].waitForExistence(timeout: 5))
        }
        XCTAssertTrue(
            app.staticTexts["共有項目はありません"].waitForExistence(timeout: 5)
        )
    }
}
