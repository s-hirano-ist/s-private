import XCTest

final class LoadingLayoutUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    @MainActor
    func testBookCoverKeepsISBNPositionThroughFailureAndRetry() {
        let app = launch(["-media-fails-first"])
        let frame = app.descendants(matching: .any)["media-frame"].firstMatch
        XCTAssertTrue(frame.waitForExistence(timeout: 5))
        XCTAssertTrue(app.descendants(matching: .any)["media-loading"].exists)
        let loadingFrame = frame.frame
        XCTAssertEqual(loadingFrame.width / loadingFrame.height, 1, accuracy: 0.01)
        let isbn = app.descendants(matching: .any)["fixture-isbn"].firstMatch
        app.swipeUp()
        completeRequest(app)
        XCTAssertTrue(app.buttons["再試行"].waitForExistence(timeout: 8))
        let failedFrame = frame.frame
        let failedISBN = isbn.frame
        app.buttons["再試行"].tap()
        XCTAssertTrue(app.descendants(matching: .any)["media-loading"].waitForExistence(timeout: 2))
        // Check geometry while retry is still pending, before releasing success.
        XCTAssertEqual(frame.frame.minY, failedFrame.minY, accuracy: 1)
        XCTAssertEqual(isbn.frame.minY, failedISBN.minY, accuracy: 1)
        completeRequest(app)
        XCTAssertTrue(app.buttons["media-open"].waitForExistence(timeout: 8))
        XCTAssertFalse(app.descendants(matching: .any)["media-loading"].exists)
        XCTAssertEqual(frame.frame.height, loadingFrame.height, accuracy: 1)
        XCTAssertEqual(frame.frame.minY, failedFrame.minY, accuracy: 1)
        XCTAssertEqual(isbn.frame.minY, failedISBN.minY, accuracy: 1)
        app.buttons["fixture-reopen"].tap()
        XCTAssertTrue(app.buttons["media-open"].waitForExistence(timeout: 2))
        XCTAssertFalse(app.descendants(matching: .any)["media-loading"].exists)
        app.swipeDown()
        XCTAssertTrue(app.buttons["media-open"].waitForExistence(timeout: 5))
        attach(app, name: "book-cover-loaded")
        app.buttons["media-open"].tap()
        XCTAssertTrue(app.buttons["閉じる"].waitForExistence(timeout: 5))
    }

    @MainActor
    func testLandscapeImageKeepsItsFrame() {
        let app = launch(["-media-landscape"])
        let frame = app.descendants(matching: .any)["media-frame"].firstMatch
        XCTAssertTrue(frame.waitForExistence(timeout: 5))
        XCTAssertTrue(app.descendants(matching: .any)["media-loading"].exists)
        let before = frame.frame
        attach(app, name: "image-loading")
        completeRequest(app)
        XCTAssertTrue(app.buttons["media-open"].waitForExistence(timeout: 8))
        XCTAssertEqual(frame.frame.minY, before.minY, accuracy: 1)
        XCTAssertEqual(frame.frame.height, before.height, accuracy: 1)
        XCTAssertEqual(frame.frame.width / frame.frame.height, 4.0 / 3.0, accuracy: 0.01)
        attach(app, name: "image-loaded")
    }

    @MainActor
    func testPreviewFitsWidthAndSupportsZoomForAllImageShapes() {
        for arguments in [[], ["-media-landscape"], ["-media-square"]] {
            let app = launch(arguments)
            completeRequest(app)
            let open = app.buttons["media-open"]
            XCTAssertTrue(open.waitForExistence(timeout: 8))
            open.tap()
            let scroll = app.scrollViews["media-preview-scroll"]
            let image = app.images["media-preview-image"]
            XCTAssertTrue(image.waitForExistence(timeout: 5))
            XCTAssertEqual(image.frame.width, scroll.frame.width, accuracy: 1)
            XCTAssertEqual(image.value as? String, "100%")
            if arguments.isEmpty {
                let top = image.frame.minY
                scroll.swipeUp()
                XCTAssertLessThan(image.frame.minY, top)
                scroll.swipeDown()
            }
            scroll.pinch(withScale: 2, velocity: 1)
            XCTAssertNotEqual(image.value as? String, "100%")
            let before = image.frame
            scroll.swipeLeft()
            XCTAssertNotEqual(image.frame.minX, before.minX)
            attach(app, name: "image-preview-zoomed-\(arguments.first ?? "portrait")")
            scroll.pinch(withScale: 0.2, velocity: -1)
            let reset = NSPredicate(format: "value == %@", "100%")
            expectation(for: reset, evaluatedWith: image)
            waitForExpectations(timeout: 5)
            XCTAssertEqual(image.frame.width, scroll.frame.width, accuracy: 1)
            scroll.pinch(withScale: 2, velocity: 1)
            app.buttons["閉じる"].tap()
            open.tap()
            XCTAssertTrue(image.waitForExistence(timeout: 5))
            XCTAssertEqual(image.value as? String, "100%")
            XCTAssertEqual(image.frame.width, scroll.frame.width, accuracy: 1)
            app.buttons["閉じる"].tap()
            app.terminate()
        }
    }

    @MainActor
    func testDeleteToolbarKeepsGeometryThroughFailureAndRetry() {
        for image in [false, true] {
            let app = XCUIApplication()
            app.launchArguments = ["-ui-testing-authenticated", "-ui-testing-list-fixtures", "-ui-testing-deletion-fixtures", "-ui-testing-action-layout", "-AppleLanguages", "(ja)"]
            if image { app.launchArguments.append("-action-image") }
            app.launch()
            let action = app.buttons[image ? "record-delete-menu" : "record-delete-button"]
            XCTAssertTrue(action.waitForExistence(timeout: 5))
            let original = action.frame
            let originalLabel = action.label
            for failure in [true, false] {
                action.tap()
                if image { app.buttons["削除"].tap() }
                let confirmation = app.sheets.buttons["削除"].firstMatch
                XCTAssertTrue(confirmation.waitForExistence(timeout: 3))
                confirmation.tap()
                let release = app.buttons[failure ? "fixture-fail" : "fixture-complete"]
                XCTAssertTrue(release.waitForExistence(timeout: 3))
                let pending = NSPredicate(format: "enabled == true")
                expectation(for: pending, evaluatedWith: release)
                waitForExpectations(timeout: 3)
                XCTAssertFalse(action.isEnabled)
                XCTAssertEqual(action.label, originalLabel + ", 削除中")
                XCTAssertEqual(action.frame.minX, original.minX, accuracy: 1)
                XCTAssertEqual(action.frame.minY, original.minY, accuracy: 1)
                XCTAssertEqual(action.frame.width, original.width, accuracy: 1)
                XCTAssertEqual(action.frame.height, original.height, accuracy: 1)
                attach(app, name: "delete-pending-\(image)-\(failure)")
                release.tap()
                if failure {
                    expectation(for: pending, evaluatedWith: action)
                    waitForExpectations(timeout: 3)
                    XCTAssertEqual(action.label, originalLabel)
                    XCTAssertTrue(app.staticTexts["fixture-calls"].label == "1")
                } else {
                    XCTAssertTrue(app.staticTexts["fixture-deleted"].waitForExistence(timeout: 5))
                    XCTAssertEqual(app.staticTexts["fixture-calls"].label, "2")
                }
            }
            app.terminate()
        }
    }

    @MainActor
    func testRSSSaveKeepsRowAndStatusGeometry() {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing-authenticated", "-ui-testing-list-fixtures", "-ui-testing-rss-fixtures", "-ui-testing-rss-delayed", "-ui-testing-rss-controlled-mutations", "-AppleLanguages", "(ja)"]
        app.launch()
        let save = app.buttons["rss-save-fixture-unread"]
        XCTAssertTrue(save.waitForExistence(timeout: 10))
        let enabled = NSPredicate(format: "enabled == true")
        expectation(for: enabled, evaluatedWith: save)
        waitForExpectations(timeout: 5)
        let row = app.buttons["rss-entry-fixture-unread"]
        let before = save.frame
        let rowBefore = row.frame
        let count = app.staticTexts["rss-count"]
        let countBefore = count.frame
        save.tap()
        let complete = app.buttons["fixture-rss-complete-mutation"]
        expectation(for: enabled, evaluatedWith: complete)
        waitForExpectations(timeout: 5)
        XCTAssertFalse(save.isEnabled)
        XCTAssertEqual(save.value as? String, "処理中")
        XCTAssertEqual(save.frame.minX, before.minX, accuracy: 1)
        XCTAssertEqual(save.frame.minY, before.minY, accuracy: 1)
        XCTAssertEqual(save.frame.width, before.width, accuracy: 1)
        XCTAssertEqual(save.frame.height, before.height, accuracy: 1)
        XCTAssertEqual(row.frame.minY, rowBefore.minY, accuracy: 1)
        XCTAssertEqual(row.frame.height, rowBefore.height, accuracy: 1)
        XCTAssertEqual(count.frame.minY, countBefore.minY, accuracy: 1)
        attach(app, name: "rss-save-pending")
        complete.tap()
        expectation(for: enabled, evaluatedWith: save)
        waitForExpectations(timeout: 5)
        XCTAssertEqual(save.frame.minY, before.minY, accuracy: 1)
        XCTAssertEqual(save.value as? String, "")
    }

    @MainActor
    private func completeRequest(_ app: XCUIApplication) {
        let button = app.buttons["fixture-complete"]
        XCTAssertTrue(button.waitForExistence(timeout: 5))
        XCTAssertTrue(button.isEnabled)
        button.tap()
    }

    @MainActor
    private func launch(_ arguments: [String]) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing-authenticated", "-ui-testing-list-fixtures", "-ui-testing-media-layout", "-AppleLanguages", "(ja)"] + arguments
        app.launch()
        return app
    }

    @MainActor
    private func attach(_ app: XCUIApplication, name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
