import XCTest

final class RssUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    @MainActor
    private func launch(offline: Bool = false, language: String = "ja", delayed: Bool = false, controlledPages: Bool = false, large: Bool = false) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = [
            "-ui-testing-authenticated", "-ui-testing-list-fixtures", "-ui-testing-rss-fixtures", "-AppleLanguages",
            "(\(language))",
        ]
        if large { app.launchArguments.append("-ui-testing-rss-large") }
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
        app.buttons["rss-feed-options-fixture-feed"].tap()
        app.buttons["rss-unsubscribe-fixture-feed"].tap()
        XCTAssertTrue(app.staticTexts["購読を解除しますか？保存済みの記事は残ります"].waitForExistence(timeout: 5))
        dismissConfirmation(app)
        attach(app, name: "rss-subscriptions")
    }

    @MainActor
    func testCountsLiveInFilterAndDiagnosticsAreInSettings() {
        let app = launch()
        let filter = app.buttons["rss-feed-filter"]
        XCTAssertTrue(filter.waitForExistence(timeout: 5))
        XCTAssertTrue(filter.label.contains("(1)") || (filter.value as? String)?.contains("(1)") == true)
        XCTAssertFalse(app.staticTexts["rss-count"].exists)
        XCTAssertFalse(app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "最終同期")).firstMatch.exists)
        filter.tap()
        XCTAssertTrue(app.buttons["すべての購読 (1)"].waitForExistence(timeout: 5))
        app.buttons["News / Example Feed (1)"].tap()
        XCTAssertTrue(app.buttons["rss-entry-fixture-unread"].exists)
        app.buttons["settings-link"].tap()
        app.swipeUp()
        app.buttons["diagnostics-link"].tap()
        XCTAssertTrue(app.descendants(matching: .any)["diagnostics-view"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["RSS最終同期"].exists)
        XCTAssertTrue(app.staticTexts["最終取得"].exists)
        attach(app, name: "rss-diagnostics")
    }

    @MainActor
    func testRemovingSelectedSubscriptionReturnsToAllSubscriptions() {
        let app = launch()
        XCTAssertTrue(app.buttons["rss-entry-fixture-unread"].waitForExistence(timeout: 5))
        app.buttons["rss-feed-filter"].tap()
        app.buttons["News / Example Feed (1)"].tap()
        app.buttons["settings-link"].tap()
        app.buttons["rss-subscriptions-link"].tap()
        app.buttons["rss-feed-options-fixture-feed"].tap()
        app.buttons["rss-unsubscribe-fixture-feed"].tap()
        app.buttons["購読解除"].tap()
        XCTAssertTrue(app.staticTexts["購読はありません"].waitForExistence(timeout: 5))
        app.navigationBars.buttons.firstMatch.tap()
        app.navigationBars.buttons.firstMatch.tap()
        XCTAssertTrue(app.staticTexts["すべての購読 (0)"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["購読を追加"].exists)
        attach(app, name: "rss-unsubscribed-empty")
    }

    @MainActor
    func testEmptyReaderOffersSubscriptionAndSavedGuidance() {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing-authenticated", "-ui-testing-list-fixtures", "-ui-testing-rss-fixtures", "-ui-testing-rss-empty", "-AppleLanguages", "(ja)"]
        app.launch()
        XCTAssertTrue(app.staticTexts["購読はありません"].waitForExistence(timeout: 5))
        let add = app.buttons["購読を追加"]
        XCTAssertGreaterThanOrEqual(add.frame.height, 44)
        add.tap()
        XCTAssertTrue(app.textFields["rss-subscribe-url"].waitForExistence(timeout: 5))
        app.buttons["キャンセル"].tap()
        app.segmentedControls["rss-view-picker"].buttons["保存済み"].tap()
        XCTAssertTrue(app.staticTexts["記事の星マークをタップすると、あとで読めるように保存できます。"].exists)
        attach(app, name: "rss-empty-saved")
    }

    @MainActor
    func testRefreshErrorKeepsCachedArticlesAndOffersRetry() {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing-authenticated", "-ui-testing-list-fixtures", "-ui-testing-rss-fixtures", "-ui-testing-rss-delayed", "-ui-testing-rss-error", "-AppleLanguages", "(ja)"]
        app.launch()
        XCTAssertTrue(app.staticTexts["rss-error"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["rss-entry-fixture-unread"].exists)
        XCTAssertFalse(app.descendants(matching: .any)["rss-empty"].exists)
        let retry = app.buttons["再試行"]
        XCTAssertTrue(retry.isEnabled && retry.isHittable)
        retry.tap()
        XCTAssertTrue(app.buttons["rss-entry-fixture-unread"].exists)
        attach(app, name: "rss-refresh-error")
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
    func testUnreadInfiniteScrollWorksOfflineThroughTheLastBatch() {
        let app = launch(offline: true, large: true)
        assertScrollsThroughAllBatches(app, entryPrefix: "fixture-large-unread-")
        attach(app, name: "rss-unread-infinite-offline")
    }

    @MainActor
    func testSavedInfiniteScrollWorksOfflineThroughTheLastBatch() {
        let app = launch(offline: true, large: true)
        app.segmentedControls["rss-view-picker"].buttons["保存済み"].tap()
        assertScrollsThroughAllBatches(app, entryPrefix: "fixture-large-saved-")
        attach(app, name: "rss-saved-infinite-offline")
    }

    @MainActor
    private func assertScrollsThroughAllBatches(_ app: XCUIApplication, entryPrefix: String) {
        XCTAssertFalse(app.buttons["前へ"].exists)
        XCTAssertFalse(app.buttons["次へ"].exists)
        let reader = app.collectionViews["rss-reader"].firstMatch
        XCTAssertTrue(reader.waitForExistence(timeout: 5))
        // Query the native collection directly while SwiftUI appends batches,
        // avoiding a search through every element type in the application.
        // Check each boundary before scrolling into the newly appended rows.
        for suffix in ["49", "99", "119"] {
            let boundary = reader.buttons["rss-entry-\(entryPrefix)\(suffix)"].firstMatch
            for _ in 0..<20 {
                if boundary.exists && boundary.isHittable { break }
                // A fast fling can skip the boundary row after the next batch is appended.
                // Use overlapping viewports so each batch boundary is actually observed.
                reader.swipeUp(velocity: .slow)
            }
            XCTAssertTrue(boundary.exists && boundary.isHittable, "Did not reach RSS batch ending at \(suffix)")
        }
        let last = reader.buttons["rss-entry-\(entryPrefix)119"].firstMatch
        XCTAssertTrue(last.exists && last.isHittable)
        reader.swipeUp()
        XCTAssertTrue(last.exists)
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
    func testOpeningAnArticleKeepsItUnreadAndAvailableToSaveUntilBulkRead() {
        let app = launch()
        let article = app.buttons["rss-entry-fixture-unread"]
        XCTAssertTrue(article.waitForExistence(timeout: 5))
        article.tap()
        let star = app.buttons["rss-save-fixture-unread"]
        XCTAssertTrue(star.isEnabled)
        star.tap()
        XCTAssertTrue(star.wait(for: \.label, toEqual: "保存を解除", timeout: 10))
        XCTAssertTrue(article.exists)

        app.buttons["rss-read-all"].tap()
        let confirm = app.buttons.matching(NSPredicate(format: "label == %@ AND identifier != %@", "すべて既読", "rss-read-all")).firstMatch
        XCTAssertTrue(confirm.waitForExistence(timeout: 5))
        confirm.tap()
        XCTAssertTrue(article.waitForNonExistence(timeout: 10))
        app.segmentedControls["rss-view-picker"].buttons["保存済み"].tap()
        XCTAssertTrue(app.staticTexts["RSSの記事タイトル — a long title that remains readable across multiple lines"].waitForExistence(timeout: 5))
    }

    @MainActor
    func testPullToRefreshStopsSpinningWhileRemainingDatabasePagesSync() {
        let app = launch(delayed: true, controlledPages: true)
        let refresh = app.buttons["rss-refresh"]
        expectation(for: NSPredicate(format: "enabled == true"), evaluatedWith: refresh)
        waitForExpectations(timeout: 20)
        let reader = app.collectionViews["rss-reader"]
        XCTAssertTrue(reader.waitForExistence(timeout: 5))
        // Accepting new arrivals can restore an interior scroll position. Return
        // to the top before arming the page gate, then pull from an article row.
        // The top 15% contains Pickers, which can consume the old drag gesture.
        reader.swipeDown(velocity: .fast)
        holdRemainingPages(app)
        let article = app.buttons["rss-entry-fixture-unread"]
        XCTAssertTrue(article.isHittable)
        article.coordinate(withNormalizedOffset: CGVector(dx: 0.1, dy: 0.5))
            .press(forDuration: 0.1, thenDragTo: reader.coordinate(withNormalizedOffset: CGVector(dx: 0.1, dy: 0.95)))
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
            // iOS 27 popovers can omit Cancel; target their native dismissal region.
            let dismissRegion = app.otherElements["PopoverDismissRegion"]
            XCTAssertTrue(dismissRegion.waitForExistence(timeout: 5))
            dismissRegion.tap()
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
