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
        let isbn = app.descendants(matching: .any)["fixture-isbn"].firstMatch
        app.swipeUp()
        XCTAssertTrue(app.buttons["再試行"].waitForExistence(timeout: 8))
        let failedFrame = frame.frame
        let failedISBN = isbn.frame
        app.buttons["再試行"].tap()
        XCTAssertTrue(app.descendants(matching: .any)["media-loading"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.descendants(matching: .any)["media-loading"].waitForNonExistence(timeout: 8))
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
        let before = frame.frame
        attach(app, name: "image-loading")
        XCTAssertTrue(app.buttons["media-open"].waitForExistence(timeout: 8))
        XCTAssertEqual(frame.frame.minY, before.minY, accuracy: 1)
        XCTAssertEqual(frame.frame.height, before.height, accuracy: 1)
        XCTAssertEqual(frame.frame.width / frame.frame.height, 4.0 / 3.0, accuracy: 0.01)
        attach(app, name: "image-loaded")
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
