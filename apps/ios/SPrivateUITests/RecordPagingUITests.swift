import XCTest

final class RecordPagingUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    @MainActor
    private func launch() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments += ["-ui-testing-authenticated", "-ui-testing-list-fixtures", "-ui-testing-paging-fixtures", "-AppleLanguages", "(ja)"]
        app.launch()
        return app
    }

    @MainActor
    private func assertPage(_ app: XCUIApplication, _ domain: String, _ id: String, file: StaticString = #filePath, line: UInt = #line) {
        let pager = app.collectionViews["record-pager"].firstMatch
        XCTAssertTrue(NSPredicate(format: "value == %@", "\(domain):\(id)").evaluate(with: pager) ||
                      XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: NSPredicate(format: "value == %@", "\(domain):\(id)"), object: pager)], timeout: 5) == .completed,
                      file: file, line: line)
    }

    @MainActor
    func testAllDomainsSwipeAndReturnToList() throws {
        let app = launch()
        for (index, domain) in ["articles", "notes", "images", "books"].enumerated() {
            app.tabBars.buttons.element(boundBy: index + 1).tap()
            let prefix = index < 2 ? "domain-record-" : "media-cell-"
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
            let detail = app.descendants(matching: .any)["record-detail-\(domain)"].firstMatch
            // Send horizontal gestures to the pager, not the nested vertical
            // detail ScrollView. A slow gesture also completes under CI load.
            let pager = app.collectionViews["record-pager"].firstMatch
            pager.swipeLeft(velocity: .slow)
            assertPage(app, domain, "page-01")
            pager.swipeRight(velocity: .slow)
            assertPage(app, domain, "page-00")
            pager.swipeRight(velocity: .slow)
            assertPage(app, domain, "page-00")
            if domain == "articles" {
                detail.coordinate(withNormalizedOffset: CGVector(dx: 0.01, dy: 0.5))
                    .press(forDuration: 0.05, thenDragTo: detail.coordinate(withNormalizedOffset: CGVector(dx: 0.9, dy: 0.5)))
            } else {
                app.navigationBars.buttons.firstMatch.tap()
            }
            XCTAssertTrue(app.descendants(matching: .any)[prefix + "page-00"].firstMatch.isHittable)
        }
    }

    @MainActor
    func testPagingContinuesPastThirtyAndStopsAtLastRecord() throws {
        let app = launch()
        app.tabBars.buttons.element(boundBy: 1).tap()
        let list = app.descendants(matching: .any)["domain-list-articles"]
        let row = app.descendants(matching: .any)["domain-record-page-28"]
        for _ in 0..<12 {
            if row.exists && row.isHittable { break }
            list.swipeUp()
        }
        XCTAssertTrue(row.isHittable)
        row.tap()
        assertPage(app, "articles", "page-28")
        for index in 29...31 {
            app.descendants(matching: .any)["record-detail-articles"].firstMatch.swipeLeft()
            assertPage(app, "articles", String(format: "page-%02d", index))
        }
        app.descendants(matching: .any)["record-detail-articles"].firstMatch.swipeLeft()
        assertPage(app, "articles", "page-31")
        app.navigationBars.buttons.firstMatch.tap()
        XCTAssertTrue(row.isHittable)
    }

    @MainActor
    func testSearchSwipesAcrossDomainsAndUpdatesDeleteToolbar() throws {
        let app = launch()
        app.tabBars.buttons.element(boundBy: 1).tap()
        app.buttons["search-button"].tap()
        let search = app.searchFields.firstMatch
        XCTAssertTrue(search.waitForExistence(timeout: 5))
        search.tap()
        search.typeText("Cross-domain\n")
        // A single result per domain gives deterministic cross-domain traversal.
        let row = app.staticTexts["Cross-domain articles"].firstMatch
        XCTAssertTrue(row.waitForExistence(timeout: 5))
        row.tap()
        assertPage(app, "articles", "page-00")
        for (current, next) in [("articles", "notes"), ("notes", "books"), ("books", "images")] {
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
        assertPage(app, "articles", "exported-articles")
        app.descendants(matching: .any)["record-detail-articles"].firstMatch.swipeLeft()
        assertPage(app, "articles", "unexported-articles")
        app.buttons["record-delete-button"].tap()
        XCTAssertTrue(app.staticTexts["この項目を削除しますか？"].waitForExistence(timeout: 5))
        app.buttons["record-delete-confirm"].firstMatch.tap()
        let complete = app.buttons["fixture-complete"]
        expectation(for: NSPredicate(format: "enabled == true"), evaluatedWith: complete)
        waitForExpectations(timeout: 3)
        app.descendants(matching: .any)["record-detail-articles"].firstMatch.swipeRight()
        assertPage(app, "articles", "unexported-articles")
        complete.tap()
        XCTAssertTrue(app.staticTexts["fixture-deleted"].waitForExistence(timeout: 5))
        XCTAssertEqual(app.staticTexts["fixture-original-record"].label, "present")
        XCTAssertEqual(app.staticTexts["fixture-next-record"].label, "missing")
    }

}
