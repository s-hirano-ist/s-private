import XCTest

final class SPrivateUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    func testEnvironmentReadyMessageIsVisible() throws {
        let app = XCUIApplication()
        app.launch()

        XCTAssertTrue(
            app.staticTexts["environment-ready-message"].waitForExistence(timeout: 5)
        )
    }
}
