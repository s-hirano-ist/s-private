import XCTest

final class RssUITests: XCTestCase {
    @MainActor
    private func launch(offline: Bool = false, language: String = "ja") -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = [
            "-ui-testing-authenticated", "-ui-testing-list-fixtures", "-ui-testing-rss-fixtures", "-AppleLanguages",
            "(\(language))",
        ]
        if offline { app.launchArguments.append("-ui-testing-rss-offline") }
        app.launch()
        return app
    }

    @MainActor
    func testRssIsTheFirstAndInitiallySelectedTabAndSavedArticlesCanBeRemoved() throws {
        let app = launch()
        XCTAssertEqual(app.tabBars.buttons.count, 5)
        XCTAssertEqual(app.tabBars.buttons.element(boundBy: 0).label, "RSS")
        XCTAssertTrue(app.tabBars.buttons.element(boundBy: 0).isSelected)
        XCTAssertTrue(app.buttons["rss-entry-fixture-unread"].waitForExistence(timeout: 5))
        app.buttons["rss-save-fixture-unread"].tap()
        XCTAssertTrue(app.buttons["rss-save-fixture-unread"].waitForExistence(timeout: 5))
        app.segmentedControls["rss-view-picker"].buttons["保存済み"].tap()
        let saved = app.buttons["rss-entry-fixture-saved"]
        XCTAssertTrue(saved.waitForExistence(timeout: 5))
        app.buttons["rss-save-fixture-saved"].tap()
        XCTAssertTrue(saved.waitForNonExistence(timeout: 5))
        attach(app, name: "rss-saved")
    }

    @MainActor
    func testBulkReadRequiresConfirmationAndSubscriptionsAreInSettings() throws {
        let app = launch()
        app.buttons["rss-read-all"].tap()
        XCTAssertTrue(app.staticTexts["表示中の購読の記事をすべて既読にしますか？"].waitForExistence(timeout: 5))
        dismissConfirmation(app)
        XCTAssertTrue(app.buttons["rss-entry-fixture-unread"].exists)
        attach(app, name: "rss-unread")
        app.buttons["settings-link"].tap()
        app.buttons["rss-subscriptions-link"].tap()
        XCTAssertTrue(app.descendants(matching: .any)["rss-subscriptions"].waitForExistence(timeout: 5))
        app.buttons["rss-add-subscription"].tap()
        let url = app.textFields["rss-subscribe-url"]
        XCTAssertTrue(url.waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["rss-subscribe-submit"].isEnabled)
        app.buttons["キャンセル"].tap()
        app.buttons["rss-unsubscribe-fixture-feed"].tap()
        XCTAssertTrue(app.staticTexts["購読を解除しますか？保存済みの記事は残ります"].waitForExistence(timeout: 5))
        dismissConfirmation(app)
        attach(app, name: "rss-subscriptions")
    }

    @MainActor
    func testOfflineCacheIsReadableWithMutationsDisabled() throws {
        let app = launch(offline: true)
        XCTAssertTrue(app.descendants(matching: .any)["rss-offline"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["rss-entry-fixture-unread"].exists)
        XCTAssertFalse(app.buttons["rss-save-fixture-unread"].isEnabled)
        XCTAssertFalse(app.buttons["rss-read-all"].isEnabled)
        XCTAssertFalse(app.buttons["rss-refresh"].isEnabled)
        app.segmentedControls["rss-view-picker"].buttons["保存済み"].tap()
        XCTAssertTrue(app.buttons["rss-entry-fixture-saved"].exists)
        attach(app, name: "rss-offline")
    }

    @MainActor
    func testRssEnglishLabels() throws {
        let app = launch(offline: true, language: "en")
        XCTAssertTrue(app.segmentedControls["rss-view-picker"].buttons["Unread"].exists)
        XCTAssertTrue(app.segmentedControls["rss-view-picker"].buttons["Saved"].exists)
        attach(app, name: "rss-english")
    }

    @MainActor
    private func dismissConfirmation(_ app: XCUIApplication) {
        if app.buttons["キャンセル"].exists {
            app.buttons["キャンセル"].tap()
        } else {
            // iOS 27 popovers dismiss on an outside tap and can omit Cancel.
            app.coordinate(withNormalizedOffset: CGVector(dx: 0.05, dy: 0.5)).tap()
        }
    }

    @MainActor
    private func attach(_ app: XCUIApplication, name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
