import XCTest

final class RecordPagingUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    @MainActor
    private func launch() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments += ["-ui-testing-authenticated", "-ui-testing-list-fixtures", "-ui-testing-paging-fixtures", "-ui-testing-article-links", "-AppleLanguages", "(ja)"]
        app.launch()
        return app
    }

    @MainActor
    private func assertPage(_ app: XCUIApplication, _ domain: String, _ id: String, file: StaticString = #filePath, line: UInt = #line) {
        let pager = app.descendants(matching: .any)["record-pager"].firstMatch
        XCTAssertTrue(NSPredicate(format: "value == %@", "\(domain):\(id)").evaluate(with: pager) ||
                      XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: NSPredicate(format: "value == %@", "\(domain):\(id)"), object: pager)], timeout: 5) == .completed,
                      file: file, line: line)
    }

    @MainActor
    func testNotesAndMediaSwipeAndReturnToList() throws {
        let app = launch()
        for (index, domain) in ["notes", "images", "books"].enumerated() {
            app.tabBars.buttons.element(boundBy: index + 2).tap()
            let prefix = domain == "notes" ? "domain-record-" : "media-cell-"
            app.descendants(matching: .any)[prefix + "page-00"].firstMatch.tap()
            if domain == "images" {
                XCTAssertTrue(app.navigationBars["1 / 32"].waitForExistence(timeout: 5))
                let scroll = app.scrollViews["media-preview-scroll"].firstMatch
                scroll.swipeLeft()
                XCTAssertTrue(app.navigationBars["2 / 32"].waitForExistence(timeout: 5))
                scroll.swipeRight()
                XCTAssertTrue(app.navigationBars["1 / 32"].waitForExistence(timeout: 5))
                scroll.swipeRight()
                XCTAssertTrue(app.navigationBars["1 / 32"].exists)
                scroll.pinch(withScale: 2, velocity: 1)
                XCTAssertNotEqual(app.images["media-preview-image"].firstMatch.value as? String, "100%")
                scroll.swipeLeft()
                XCTAssertTrue(app.navigationBars["1 / 32"].exists)
                app.buttons["閉じる"].tap()
                XCTAssertTrue(app.descendants(matching: .any)[prefix + "page-00"].firstMatch.isHittable)
                continue
            }
            assertPage(app, domain, "page-00")
            // Send horizontal gestures to the pager, not the nested vertical
            // detail ScrollView. A slow gesture also completes under CI load.
            let pager = app.descendants(matching: .any)["record-pager"].firstMatch
            pager.swipeLeft(velocity: .slow)
            assertPage(app, domain, "page-01")
            pager.swipeRight(velocity: .slow)
            assertPage(app, domain, "page-00")
            pager.swipeRight(velocity: .slow)
            assertPage(app, domain, "page-00")
            app.navigationBars.buttons.firstMatch.tap()
            XCTAssertTrue(app.descendants(matching: .any)[prefix + "page-00"].firstMatch.isHittable)
        }
    }

    @MainActor
    func testLongNoteCancelledDragAndConsecutiveSwipes() throws {
        let app = launch()
        app.tabBars.buttons.element(boundBy: 2).tap()
        app.descendants(matching: .any)["domain-record-page-00"].firstMatch.tap()
        assertPage(app, "notes", "page-00")
        let pager = app.descendants(matching: .any)["record-pager"].firstMatch
        let start = pager.coordinate(withNormalizedOffset: CGVector(dx: 0.7, dy: 0.5))
        start.press(forDuration: 0.05, thenDragTo: pager.coordinate(withNormalizedOffset: CGVector(dx: 0.62, dy: 0.5)),
                    withVelocity: .slow, thenHoldForDuration: 0.5)
        assertPage(app, "notes", "page-00")
        for _ in 0..<3 { pager.swipeLeft(velocity: .fast) }
        assertPage(app, "notes", "page-03")
        let title = app.staticTexts["Paging notes 3"].firstMatch
        XCTAssertEqual(title.frame.minX, app.windows.firstMatch.frame.minX + 16, accuracy: 2)
        XCTAssertGreaterThanOrEqual(title.frame.minX, pager.frame.minX)
        XCTAssertLessThanOrEqual(title.frame.maxX, pager.frame.maxX)
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "Long note after consecutive swipes"
        screenshot.lifetime = .keepAlways
        add(screenshot)
        for _ in 0..<3 { pager.swipeRight(velocity: .fast) }
        assertPage(app, "notes", "page-00")
        let detail = app.scrollViews["record-detail-notes"].firstMatch
        detail.swipeUp()
        assertPage(app, "notes", "page-00")
        pager.swipeLeft()
        assertPage(app, "notes", "page-01")
    }

    @MainActor
    func testPagingContinuesPastThirtyAndStopsAtLastRecord() throws {
        let app = launch()
        app.tabBars.buttons.element(boundBy: 2).tap()
        let list = app.descendants(matching: .any)["domain-list-notes"]
        let row = app.descendants(matching: .any)["domain-record-page-28"]
        for _ in 0..<12 {
            if row.exists && row.isHittable { break }
            list.swipeUp()
        }
        XCTAssertTrue(row.isHittable)
        row.tap()
        assertPage(app, "notes", "page-28")
        for index in 29...31 {
            app.descendants(matching: .any)["record-detail-notes"].firstMatch.swipeLeft()
            assertPage(app, "notes", String(format: "page-%02d", index))
        }
        app.descendants(matching: .any)["record-detail-notes"].firstMatch.swipeLeft()
        assertPage(app, "notes", "page-31")
        app.navigationBars.buttons.firstMatch.tap()
        XCTAssertTrue(row.isHittable)
    }

    @MainActor
    private func launchSearch() -> XCUIApplication {
        let app = launch()
        app.tabBars.buttons.element(boundBy: 1).tap()
        app.buttons["search-button"].tap()
        let search = app.searchFields.firstMatch
        XCTAssertTrue(search.waitForExistence(timeout: 5))
        search.tap()
        search.typeText("Cross-domain\n")
        return app
    }

    @MainActor
    func testArticleSearchResultOpensItsURL() {
        let app = launchSearch()
        let row = app.buttons["search-result-articles-page-00"]
        XCTAssertTrue(row.waitForExistence(timeout: 5))
        row.tap()
        XCTAssertFalse(app.descendants(matching: .any)["record-pager"].exists)
        let close = app.buttons["search-close-button"]
        if !close.isHittable { app.buttons["閉じる"].firstMatch.tap() }
        close.tap()
        let openedURL = app.staticTexts["opened-article-url"]
        XCTAssertTrue(openedURL.waitForExistence(timeout: 5))
        XCTAssertEqual(openedURL.label, "https://example.com/page-00")
    }

    @MainActor
    func testSearchSwipesAcrossDomainsAndUpdatesDeleteToolbar() {
        let app = launchSearch()
        let row = app.buttons["search-result-notes-page-00"]
        XCTAssertTrue(row.waitForExistence(timeout: 5))
        row.tap()
        assertPage(app, "notes", "page-00")
        for (current, next) in [("notes", "books"), ("books", "images")] {
            app.descendants(matching: .any)["record-detail-\(current)"].firstMatch.swipeLeft()
            assertPage(app, next, "page-00")
        }
        XCTAssertTrue(app.buttons["record-delete-menu"].exists)
        app.buttons["record-delete-menu"].tap()
        app.buttons["削除"].tap()
        XCTAssertTrue(app.staticTexts["この項目を削除しますか？"].waitForExistence(timeout: 5))
    }

    @MainActor
    func testDeleteAfterSwipingRemovesTheSelectedRecord() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing-authenticated", "-ui-testing-list-fixtures", "-ui-testing-deletion-fixtures", "-ui-testing-action-layout", "-action-paging", "-AppleLanguages", "(ja)"]
        app.launch()
        assertPage(app, "notes", "exported-notes")
        app.descendants(matching: .any)["record-detail-notes"].firstMatch.swipeLeft()
        assertPage(app, "notes", "unexported-notes")
        app.buttons["record-delete-button"].tap()
        XCTAssertTrue(app.staticTexts["この項目を削除しますか？"].waitForExistence(timeout: 5))
        app.buttons["record-delete-confirm"].firstMatch.tap()
        let complete = app.buttons["fixture-complete"]
        expectation(for: NSPredicate(format: "enabled == true"), evaluatedWith: complete)
        // The paged detail updates its selection before the fixture request is
        // exposed. A loaded CI simulator can take longer than the default
        // interaction timeout to publish that state.
        waitForExpectations(timeout: 10)
        app.descendants(matching: .any)["record-detail-notes"].firstMatch.swipeRight()
        assertPage(app, "notes", "unexported-notes")
        complete.tap()
        XCTAssertTrue(app.staticTexts["fixture-deleted"].waitForExistence(timeout: 5))
        XCTAssertEqual(app.staticTexts["fixture-original-record"].label, "present")
        XCTAssertEqual(app.staticTexts["fixture-next-record"].label, "missing")
    }

}
