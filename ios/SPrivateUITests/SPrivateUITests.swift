import XCTest

final class SPrivateUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    func testAuthenticationEntryIsVisible() throws {
        let app = XCUIApplication()
        app.launch()

        let unconfiguredMessage = app.staticTexts["auth0-unconfigured-message"]
        if !unconfiguredMessage.waitForExistence(timeout: 1) {
            XCTAssertTrue(app.buttons["auth0-login-button"].waitForExistence(timeout: 5))
        }
        XCTAssertTrue(app.navigationBars["SPrivate"].waitForExistence(timeout: 5))
    }

    @MainActor
    func testDomainAndSearchTabsAreVisible() throws {
        let app = XCUIApplication()
        app.launchArguments.append("-ui-testing-authenticated")
        app.launch()

        let tabBar = app.tabBars.firstMatch
        XCTAssertTrue(tabBar.waitForExistence(timeout: 5))
        XCTAssertEqual(tabBar.buttons.count, 5)
        tabBar.buttons.element(boundBy: 4).tap()
        XCTAssertTrue(app.searchFields.firstMatch.waitForExistence(timeout: 5))
        app.buttons["settings-link"].tap()
        XCTAssertTrue(app.navigationBars.firstMatch.waitForExistence(timeout: 5))
    }
}
