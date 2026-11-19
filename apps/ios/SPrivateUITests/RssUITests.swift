import XCTest

final class RssUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    @MainActor
    private func launch(offline: Bool = false, language: String = "ja", delayed: Bool = false, controlledPages: Bool = false) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = [
            "-ui-testing-authenticated", "-ui-testing-list-fixtures", "-ui-testing-rss-fixtures", "-AppleLanguages",
            "(\(language))",
        ]
        if delayed { app.launchArguments.append("-ui-testing-rss-delayed") }
        if controlledPages { app.launchArguments.append("-ui-testing-rss-controlled-pages") }
        if offline { app.launchArguments.append("-ui-testing-rss-offline") }
        app.launch()
        if delayed {
            // The seeded cache has one article; the server's two additions are
            // intentionally hidden until the reader accepts the new arrivals.
            let showNew = app.buttons["rss-show-new"]
            XCTAssertTrue(showNew.waitForExistence(timeout: 10))
            showNew.tap()
            XCTAssertTrue(app.buttons["rss-entry-fixture-third"].waitForExistence(timeout: 5))
        }
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
    func testSavingDifferentArticlesDuringRefreshSurvivesTabNavigation() {
        let app = launch(delayed: true, controlledPages: true)
        holdRemainingPages(app)
        let refresh = app.buttons["rss-refresh"]
        expectation(for: NSPredicate(format: "enabled == true"), evaluatedWith: refresh)
        waitForExpectations(timeout: 10)
        refresh.tap()
        waitForHeldPage(app)
        XCTAssertTrue(app.descendants(matching: .any)["rss-loading"].exists)
        XCTAssertTrue(app.buttons["rss-save-fixture-unread"].isEnabled)
        app.buttons["rss-save-fixture-unread"].tap()
        app.buttons["rss-save-fixture-second"].tap()
        app.tabBars.buttons.element(boundBy: 3).tap()
        app.tabBars.buttons["RSS"].tap()
        app.segmentedControls["rss-view-picker"].buttons["保存済み"].tap()
        XCTAssertTrue(app.descendants(matching: .any)["rss-loading"].exists)
        // Both inputs were accepted during sync. Let the pending metadata
        // reconciliation finish before checking the serialized writes' result.
        releaseRemainingPages(app)
        XCTAssertTrue(app.staticTexts["Second unread article"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["rss-entry-fixture-saved"].exists)
        attach(app, name: "rss-concurrent-saves")
    }

    @MainActor
    func testOpeningDifferentArticlesWhileASaveIsPendingKeepsBothReads() {
        let app = launch(delayed: true)
        XCTAssertTrue(app.buttons["rss-entry-fixture-third"].waitForExistence(timeout: 10))
        app.buttons["rss-save-fixture-third"].tap()
        app.buttons["rss-entry-fixture-unread"].tap()
        app.buttons["rss-entry-fixture-second"].tap()
        XCTAssertTrue(app.buttons["rss-entry-fixture-unread"].waitForNonExistence(timeout: 10))
        XCTAssertTrue(app.buttons["rss-entry-fixture-second"].waitForNonExistence(timeout: 10))
        XCTAssertTrue(app.buttons["rss-entry-fixture-third"].exists)
        app.segmentedControls["rss-view-picker"].buttons["保存済み"].tap()
        XCTAssertTrue(app.staticTexts["Third unread article"].waitForExistence(timeout: 10))
        attach(app, name: "rss-concurrent-reads")
    }

    @MainActor
    func testPullToRefreshStopsSpinningWhileRemainingDatabasePagesSync() {
        let app = launch(delayed: true, controlledPages: true)
        let refresh = app.buttons["rss-refresh"]
        expectation(for: NSPredicate(format: "enabled == true"), evaluatedWith: refresh)
        waitForExpectations(timeout: 20)
        holdRemainingPages(app)
        let reader = app.descendants(matching: .any)["rss-reader"].firstMatch
        XCTAssertTrue(reader.waitForExistence(timeout: 5))
        // Drag inside the list from its top; an application-wide swipe can hit
        // the navigation bar or a row action without starting native refresh.
        reader.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.15))
            .press(forDuration: 0.1, thenDragTo: reader.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.9)))
        waitForHeldPage(app)
        XCTAssertTrue(app.descendants(matching: .any)["rss-loading"].exists)
        XCTAssertTrue(app.activityIndicators.firstMatch.waitForNonExistence(timeout: 3))
        XCTAssertFalse(refresh.isEnabled) // The complete offline copy is still downloading.
        XCTAssertTrue(app.buttons["rss-entry-fixture-unread"].exists)
        XCTAssertTrue(app.buttons["rss-save-fixture-unread"].isEnabled)
        app.tabBars.buttons.element(boundBy: 3).tap()
        app.tabBars.buttons["RSS"].tap()
        XCTAssertTrue(app.buttons["rss-entry-fixture-unread"].waitForExistence(timeout: 5))
        releaseRemainingPages(app)
        attach(app, name: "rss-db-refresh-background-copy")
    }

    @MainActor
    private func holdRemainingPages(_ app: XCUIApplication) {
        let refresh = app.buttons["rss-refresh"]
        expectation(for: NSPredicate(format: "enabled == true"), evaluatedWith: refresh)
        waitForExpectations(timeout: 10)
        let hold = app.buttons["fixture-rss-hold-pages"]
        XCTAssertTrue(hold.waitForExistence(timeout: 5))
        hold.tap()
        XCTAssertFalse(hold.isEnabled)
    }

    @MainActor
    private func waitForHeldPage(_ app: XCUIApplication) {
        let release = app.buttons["fixture-rss-release-pages"]
        expectation(for: NSPredicate(format: "enabled == true"), evaluatedWith: release)
        waitForExpectations(timeout: 10)
    }

    @MainActor
    private func releaseRemainingPages(_ app: XCUIApplication) {
        app.buttons["fixture-rss-release-pages"].tap()
        expectation(for: NSPredicate(format: "enabled == true"), evaluatedWith: app.buttons["rss-refresh"])
        waitForExpectations(timeout: 10)
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
