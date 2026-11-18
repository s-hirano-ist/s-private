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
