import XCTest

final class SPrivateUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    func testAuthenticationEntryIsVisible() throws {
        let app = XCUIApplication()
        app.launchArguments.append("-ui-testing-signed-out")
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
        app.buttons["sync-management-link"].tap()
        XCTAssertTrue(app.descendants(matching: .any)["sync-management-view"].waitForExistence(timeout: 5))
    }

    @MainActor
    func testMediaTabsUseGridsAndTextTabsUseLists() throws {
        let app = XCUIApplication()
        app.launchArguments.append("-ui-testing-authenticated")
        app.launch()

        let tabs = app.tabBars.firstMatch.buttons
        XCTAssertTrue(tabs.element(boundBy: 0).waitForExistence(timeout: 5))
        XCTAssertTrue(app.descendants(matching: .any)["domain-list-articles"].exists)
        tabs.element(boundBy: 1).tap()
        XCTAssertTrue(app.descendants(matching: .any)["domain-list-notes"].exists)
        tabs.element(boundBy: 2).tap()
        XCTAssertTrue(app.descendants(matching: .any)["domain-grid-images"].exists)
        tabs.element(boundBy: 3).tap()
        XCTAssertTrue(app.descendants(matching: .any)["domain-grid-books"].exists)
    }
}
