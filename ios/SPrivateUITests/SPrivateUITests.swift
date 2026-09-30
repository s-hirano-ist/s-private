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
        XCTAssertTrue(app.navigationBars["Memdex"].waitForExistence(timeout: 5))
    }

    @MainActor
    func testFourDomainTabsOfferHeaderActionsInWebOrder() throws {
        let app = XCUIApplication()
        app.launchArguments.append("-ui-testing-authenticated")
        app.launch()

        let tabBar = app.tabBars.firstMatch
        XCTAssertTrue(tabBar.waitForExistence(timeout: 5))
        XCTAssertEqual(tabBar.buttons.count, 4)
        for (index, domain) in ["articles", "notes", "books", "images"].enumerated() {
            tabBar.buttons.element(boundBy: index).tap()
            let identifier = index < 2 ? "domain-list-\(domain)" : "domain-grid-\(domain)"
            XCTAssertTrue(app.descendants(matching: .any)[identifier].waitForExistence(timeout: 5))
            let createButton = app.buttons["create-button"]
            let searchButton = app.buttons["search-button"]
            let settingsLink = app.buttons["settings-link"]
            XCTAssertTrue(createButton.exists)
            XCTAssertTrue(searchButton.exists)
            XCTAssertTrue(settingsLink.exists)
            XCTAssertLessThan(createButton.frame.midX, searchButton.frame.midX)
            XCTAssertLessThan(searchButton.frame.midX, settingsLink.frame.midX)
            app.buttons["search-button"].tap()
            XCTAssertTrue(app.searchFields.firstMatch.waitForExistence(timeout: 5))
            XCTAssertFalse(app.buttons["settings-link"].isHittable)
            app.buttons["search-close-button"].tap()
            XCTAssertTrue(app.descendants(matching: .any)[identifier].waitForExistence(timeout: 5))
            settingsLink.tap()
            XCTAssertTrue(app.descendants(matching: .any)["settings-view"].waitForExistence(timeout: 5))
            app.navigationBars.buttons.firstMatch.tap()
            XCTAssertTrue(app.descendants(matching: .any)[identifier].waitForExistence(timeout: 5))
        }
        app.buttons["settings-link"].tap()
        XCTAssertTrue(app.descendants(matching: .any)["settings-view"].waitForExistence(timeout: 5))
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
        XCTAssertTrue(app.descendants(matching: .any)["domain-grid-books"].exists)
        tabs.element(boundBy: 3).tap()
        XCTAssertTrue(app.descendants(matching: .any)["domain-grid-images"].exists)
    }

    @MainActor
    func testFourDomainTabsOfferOnlyUnexportedAndExportedFilters() throws {
        let app = XCUIApplication()
        app.launchArguments.append("-ui-testing-authenticated")
        app.launch()

        let tabs = app.tabBars.firstMatch.buttons
        XCTAssertTrue(tabs.element(boundBy: 0).waitForExistence(timeout: 5))
        for index in 0..<4 {
            tabs.element(boundBy: index).tap()
            let filter = app.buttons["status-filter"]
            XCTAssertTrue(filter.waitForExistence(timeout: 5))
            XCTAssertTrue(filter.label.contains("未公開") || filter.label.contains("Unexported"))
            filter.tap()
            XCTAssertEqual(app.buttons.matching(identifier: "公開済み").count + app.buttons.matching(identifier: "Exported").count, 1)
            XCTAssertFalse(app.buttons["すべて"].exists)
            XCTAssertFalse(app.buttons["All"].exists)
            XCTAssertFalse(app.buttons["更新済み"].exists)
            XCTAssertFalse(app.buttons["Updated"].exists)
            let exported = app.buttons["公開済み"].exists ? app.buttons["公開済み"] : app.buttons["Exported"]
            exported.tap()
            XCTAssertTrue(filter.label.contains("公開済み") || filter.label.contains("Exported"))
        }
    }

    @MainActor
    func testArticleAndNoteRowsShowLongTitlesAndOpenDetails() throws {
        let app = XCUIApplication()
        app.launchArguments += ["-ui-testing-authenticated", "-ui-testing-list-fixtures"]
        app.launch()

        let tabs = app.tabBars.firstMatch.buttons
        for (index, domain) in ["article", "note"].enumerated() {
            tabs.element(boundBy: index).tap()
            let shortRow = app.descendants(matching: .any)["domain-record-\(domain)-short"]
            let longRow = app.descendants(matching: .any)["domain-record-\(domain)-long"]
            XCTAssertTrue(shortRow.waitForExistence(timeout: 5))
            XCTAssertTrue(longRow.waitForExistence(timeout: 5))
            XCTAssertGreaterThan(longRow.frame.height, shortRow.frame.height)
            let screenshot = XCTAttachment(screenshot: app.screenshot())
            screenshot.name = "\(domain)-list"
            screenshot.lifetime = .keepAlways
            add(screenshot)
            longRow.tap()
            XCTAssertTrue(app.descendants(matching: .any)["record-detail-\(domain)s"].waitForExistence(timeout: 5))
            app.navigationBars.buttons.firstMatch.tap()
        }
    }
}
