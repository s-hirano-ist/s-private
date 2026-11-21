import XCTest

final class ImageGalleryUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    @MainActor
    func testDirectPresentationPagingZoomAndReturn() {
        let app = launch()
        app.buttons["media-cell-gallery-00"].tap()
        XCTAssertTrue(app.buttons["gallery-delete"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["media-open"].exists)
        XCTAssertTrue(app.navigationBars["1 / 35"].exists)
        let scroll = app.scrollViews["media-preview-scroll"].firstMatch
        scroll.swipeLeft()
        XCTAssertTrue(app.navigationBars["2 / 35"].waitForExistence(timeout: 3))
        scroll.pinch(withScale: 2, velocity: 1)
        scroll.swipeLeft()
        XCTAssertTrue(app.navigationBars["2 / 35"].exists)
        app.buttons["閉じる"].tap()
        XCTAssertTrue(app.buttons["media-cell-gallery-00"].waitForExistence(timeout: 3))
        app.buttons["media-cell-gallery-00"].tap()
        XCTAssertTrue(app.navigationBars["1 / 35"].waitForExistence(timeout: 3))
        XCTAssertEqual(app.images["media-preview-image"].firstMatch.value as? String, "100%")
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "direct-full-screen-gallery"
        screenshot.lifetime = .keepAlways
        add(screenshot)
    }

    @MainActor
    func testDeleteFailureRetryAndNextSelection() {
        let app = launch(["-gallery-fail-delete"])
        app.buttons["media-cell-gallery-00"].tap()
        confirmDelete(app)
        XCTAssertTrue(app.staticTexts["gallery-error"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.navigationBars["1 / 35"].exists)
        confirmDelete(app)
        XCTAssertTrue(app.navigationBars["1 / 34"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.images["media-preview-image"].exists)
        app.buttons["閉じる"].tap()
        XCTAssertFalse(app.buttons["media-cell-gallery-00"].exists)
        XCTAssertTrue(app.buttons["media-cell-gallery-01"].exists)
    }

    @MainActor
    func testRetryLoadingAndDeleteLastImage() {
        let app = launch(["-gallery-single", "-gallery-fail-load"])
        app.buttons["media-cell-gallery-00"].tap()
        XCTAssertTrue(app.buttons["再試行"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["gallery-delete"].isEnabled)
        app.buttons["再試行"].tap()
        XCTAssertTrue(app.images["media-preview-image"].waitForExistence(timeout: 5))
        app.buttons["gallery-delete"].tap()
        if app.buttons["キャンセル"].exists { app.buttons["キャンセル"].tap() }
        else { app.otherElements["PopoverDismissRegion"].tap() }
        XCTAssertTrue(app.navigationBars["1 / 1"].exists)
        confirmDelete(app)
        XCTAssertTrue(app.descendants(matching: .any)["domain-empty-images"].firstMatch.waitForExistence(timeout: 5))
        app.buttons["status-filter"].tap()
        XCTAssertTrue(app.buttons["media-cell-gallery-99"].waitForExistence(timeout: 5))
        app.buttons["media-cell-gallery-99"].tap()
        XCTAssertTrue(app.navigationBars["1 / 1"].waitForExistence(timeout: 5))
    }

    @MainActor
    func testPagesBeyondGridLimitAndPreservesScrollPosition() {
        let app = launch()
        let cell = app.buttons["media-cell-gallery-29"]
        for _ in 0..<8 {
            if cell.exists && cell.isHittable { break }
            app.swipeUp()
        }
        XCTAssertTrue(cell.isHittable)
        cell.tap()
        XCTAssertTrue(app.navigationBars["30 / 35"].waitForExistence(timeout: 5))
        for position in 31...35 {
            app.scrollViews["media-preview-scroll"].firstMatch.swipeLeft()
            XCTAssertTrue(app.navigationBars["\(position) / 35"].waitForExistence(timeout: 3))
        }
        app.scrollViews["media-preview-scroll"].firstMatch.swipeLeft()
        XCTAssertTrue(app.navigationBars["35 / 35"].exists)
        app.buttons["閉じる"].tap()
        XCTAssertTrue(cell.isHittable)
    }

    @MainActor
    func testSearchOpensSingleImageAndRefreshesAfterDeletion() {
        let app = launch()
        app.buttons["search-button"].tap()
        let search = app.searchFields.firstMatch
        XCTAssertTrue(search.waitForExistence(timeout: 5))
        search.tap()
        search.typeText("Gallery 0\n")
        let result = app.buttons["search-result-images-gallery-00"]
        XCTAssertTrue(result.waitForExistence(timeout: 5))
        result.tap()
        XCTAssertTrue(app.navigationBars["1 / 1"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.images["media-preview-image"].waitForExistence(timeout: 5))
        confirmDelete(app)
        XCTAssertTrue(app.buttons["gallery-delete"].waitForNonExistence(timeout: 5))
        XCTAssertTrue(search.waitForExistence(timeout: 5))
        XCTAssertEqual(search.value as? String, "Gallery 0")
        XCTAssertTrue(result.waitForNonExistence(timeout: 5))
    }

    @MainActor
    private func confirmDelete(_ app: XCUIApplication) {
        let button = app.buttons["gallery-delete"]
        XCTAssertTrue(button.waitForExistence(timeout: 5))
        button.tap()
        let confirmation = app.sheets.buttons["削除"].firstMatch
        XCTAssertTrue(confirmation.waitForExistence(timeout: 3))
        confirmation.tap()
    }

    @MainActor
    private func launch(_ arguments: [String] = []) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing-authenticated", "-ui-testing-list-fixtures", "-ui-testing-gallery", "-AppleLanguages", "(ja)"] + arguments
        app.launch()
        XCTAssertTrue(app.buttons["media-cell-gallery-00"].waitForExistence(timeout: 10))
        return app
    }
}
