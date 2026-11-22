import XCTest

final class SPrivateUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    func testExportedContentOffersDeleteConfirmationInAllDomains() throws {
        let app = XCUIApplication()
        app.launchArguments += ["-ui-testing-authenticated", "-ui-testing-list-fixtures", "-ui-testing-deletion-fixtures", "-AppleLanguages", "(ja)"]
        app.launch()
        for (index, domain) in ["articles", "notes", "images", "books"].enumerated() {
            app.tabBars.buttons.element(boundBy: index + 1).tap()
            let identifier = index < 2 ? "domain-record-exported-\(domain)" : "media-cell-exported-\(domain)"
            let row = app.descendants(matching: .any)[identifier]
            XCTAssertTrue(row.waitForExistence(timeout: 5))
            row.tap()
            let detail = app.descendants(matching: .any)[domain == "images" ? "image-gallery" : "record-detail-\(domain)"].firstMatch
            XCTAssertTrue(detail.waitForExistence(timeout: 5))
            app.buttons[domain == "images" ? "gallery-delete" : "record-delete-button"].tap()
            let confirmation = app.staticTexts["この項目を削除しますか？"]
            XCTAssertTrue(confirmation.waitForExistence(timeout: 5))
            if app.buttons["キャンセル"].exists {
                app.buttons["キャンセル"].tap()
            } else {
                // iOS 27 popovers can omit Cancel; target their native dismissal region.
                let dismissRegion = app.otherElements["PopoverDismissRegion"]
                XCTAssertTrue(dismissRegion.waitForExistence(timeout: 5))
                dismissRegion.tap()
            }
            XCTAssertTrue(confirmation.waitForNonExistence(timeout: 5))
            XCTAssertTrue(detail.exists)
            let screenshot = XCTAttachment(screenshot: app.screenshot())
            screenshot.name = "exported-\(domain)-delete"
            screenshot.lifetime = .keepAlways
            add(screenshot)
            if domain == "images" { app.buttons["閉じる"].tap() }
            else { app.navigationBars.buttons.firstMatch.tap() }
        }
    }

    @MainActor
    func testDomainTabsFollowSystemLanguage() throws {
        for (language, expectedTab) in [("ja", "記事"), ("en", "Articles")] {
            let app = XCUIApplication()
            app.launchArguments += ["-ui-testing-authenticated", "-ui-testing-list-fixtures", "-AppleLanguages", "(\(language))"]
            app.launch()
            XCTAssertTrue(app.tabBars.buttons[expectedTab].waitForExistence(timeout: 5))
            app.terminate()
        }
    }

    @MainActor
    func testArticleCategoryRequiresAValidName() throws {
        let app = XCUIApplication()
        app.launchArguments += ["-ui-testing-authenticated", "-ui-testing-list-fixtures", "-AppleLanguages", "(ja)"]
        app.launch()
        app.tabBars.buttons.element(boundBy: 1).tap()
        app.buttons["create-button"].tap()

        let title = app.textFields["create-title-field"]
        XCTAssertTrue(title.waitForExistence(timeout: 5))
        enterText("Example", into: title, in: app)
        let url = app.textFields["URL"]
        enterText("https://example.com", into: url, in: app)

        let category = app.textFields["category-name-field"]
        XCTAssertTrue(category.exists)
        enterText(String(repeating: "a", count: 17), into: category, in: app)
        XCTAssertFalse(app.buttons["save-button"].isEnabled)
        XCTAssertTrue(app.staticTexts["カテゴリ名は1〜16文字で入力してください"].exists)
        category.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: 17) + "Tech")
        XCTAssertTrue(app.buttons["save-button"].isEnabled)
    }

    @MainActor
    func testCacheClearRequiresConfirmation() throws {
        let app = XCUIApplication()
        app.launchArguments += ["-ui-testing-authenticated", "-ui-testing-list-fixtures", "-AppleLanguages", "(ja)"]
        app.launch()
        app.buttons["settings-link"].tap()
        let clear = app.buttons["キャッシュを削除"]
        XCTAssertTrue(clear.waitForExistence(timeout: 5))
        clear.tap()
        XCTAssertTrue(app.staticTexts["キャッシュを削除しますか？"].waitForExistence(timeout: 5))
        app.buttons["キャンセル"].tap()
        XCTAssertTrue(app.descendants(matching: .any)["settings-view"].exists)
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
        app.launchArguments += ["-ui-testing-authenticated", "-ui-testing-list-fixtures"]
        app.launch()

        let tabBar = app.tabBars.firstMatch
        XCTAssertTrue(tabBar.waitForExistence(timeout: 5))
        XCTAssertEqual(tabBar.buttons.count, 5)
        let domains = [
            (id: "articles", japanese: "記事", english: "Articles"),
            (id: "notes", japanese: "ノート", english: "Notes"),
            (id: "images", japanese: "画像", english: "Images"),
            (id: "books", japanese: "書籍", english: "Books"),
        ]
        for (index, domain) in domains.enumerated() {
            let tab = tabBar.buttons.element(boundBy: index + 1)
            XCTAssertTrue(tab.label.contains(domain.japanese) || tab.label.contains(domain.english))
            tab.tap()
            let identifier = index < 2 ? "domain-list-\(domain.id)" : "domain-grid-\(domain.id)"
            XCTAssertTrue(app.descendants(matching: .any)[identifier].waitForExistence(timeout: 5))
            XCTAssertFalse(app.navigationBars.firstMatch.staticTexts[domain.japanese].exists)
            XCTAssertFalse(app.navigationBars.firstMatch.staticTexts[domain.english].exists)
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
        app.launchArguments += ["-ui-testing-authenticated", "-ui-testing-list-fixtures"]
        app.launch()

        let tabs = app.tabBars.firstMatch.buttons
        XCTAssertTrue(tabs.element(boundBy: 0).waitForExistence(timeout: 5))
        tabs.element(boundBy: 1).tap()
        XCTAssertTrue(app.descendants(matching: .any)["domain-list-articles"].exists)
        tabs.element(boundBy: 2).tap()
        XCTAssertTrue(app.descendants(matching: .any)["domain-list-notes"].exists)
        tabs.element(boundBy: 3).tap()
        XCTAssertTrue(app.descendants(matching: .any)["domain-grid-images"].exists)
        tabs.element(boundBy: 4).tap()
        XCTAssertTrue(app.descendants(matching: .any)["domain-grid-books"].exists)
    }

    @MainActor
    func testFourDomainTabsDefaultToExportedAndToggleWithOneTap() throws {
        let app = XCUIApplication()
        app.launchArguments += ["-ui-testing-authenticated", "-ui-testing-list-fixtures", "-ui-testing-deletion-fixtures", "-AppleLanguages", "(ja)"]
        app.launch()

        let tabs = app.tabBars.firstMatch.buttons
        XCTAssertTrue(tabs.element(boundBy: 0).waitForExistence(timeout: 5))
        for (index, domain) in ["articles", "notes", "images", "books"].enumerated() {
            tabs.element(boundBy: index + 1).tap()
            let filter = app.buttons["status-filter"]
            XCTAssertTrue(filter.waitForExistence(timeout: 5))
            XCTAssertTrue(filter.label.contains("公開済み"))
            XCTAssertFalse(filter.staticTexts["公開済み"].exists)
            let prefix = index < 2 ? "domain-record" : "media-cell"
            let exported = app.descendants(matching: .any)["\(prefix)-exported-\(domain)"]
            let unexported = app.descendants(matching: .any)["\(prefix)-unexported-\(domain)"]
            XCTAssertTrue(exported.waitForExistence(timeout: 5))
            XCTAssertFalse(unexported.exists)
            filter.tap()
            XCTAssertTrue(filter.label.contains("未公開"))
            XCTAssertFalse(filter.staticTexts["未公開"].exists)
            XCTAssertTrue(unexported.waitForExistence(timeout: 5))
            XCTAssertFalse(exported.exists)
            tabs.element(boundBy: 0).tap()
            tabs.element(boundBy: index + 1).tap()
            XCTAssertTrue(filter.label.contains("未公開"))
            filter.tap()
            XCTAssertTrue(filter.label.contains("公開済み"))
            XCTAssertTrue(exported.waitForExistence(timeout: 5))
            filter.tap()
        }
        app.terminate()
        app.launch()
        tabs.element(boundBy: 1).tap()
        XCTAssertTrue(app.buttons["status-filter"].label.contains("公開済み"))
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "default-exported-status"
        screenshot.lifetime = .keepAlways
        add(screenshot)
    }

    @MainActor
    func testStatusToggleWithReducedMotionAndEmptyList() {
        assertStatusToggleWithEmptyList(reduceMotion: true)
    }

    @MainActor
    func testStatusFlipWithEmptyList() {
        assertStatusToggleWithEmptyList(reduceMotion: false)
    }

    @MainActor
    private func assertStatusToggleWithEmptyList(reduceMotion: Bool) {
        let app = XCUIApplication()
        app.launchArguments += ["-ui-testing-authenticated", "-ui-testing-list-fixtures", "-AppleLanguages", "(ja)"]
        if reduceMotion { app.launchArguments.append("-ui-testing-reduce-motion") }
        app.launch()
        let tabs = app.tabBars.firstMatch.buttons
        XCTAssertTrue(tabs.element(boundBy: 1).waitForExistence(timeout: 5))
        tabs.element(boundBy: 1).tap()
        let filter = app.buttons["status-filter"]
        let empty = app.descendants(matching: .any)["domain-empty-articles"]
        let record = app.descendants(matching: .any)["domain-record-article-short"]
        XCTAssertTrue(empty.waitForExistence(timeout: 5))
        XCTAssertTrue(filter.label.contains("公開済み"))
        for _ in 0..<3 {
            filter.tap()
            XCTAssertTrue(record.waitForExistence(timeout: 5))
            XCTAssertTrue(filter.label.contains("未公開"))
            XCTAssertTrue(filter.isEnabled)
            XCTAssertFalse(empty.exists)
            filter.tap()
            XCTAssertTrue(empty.waitForExistence(timeout: 5))
            XCTAssertTrue(filter.label.contains("公開済み"))
            XCTAssertTrue(filter.isEnabled)
            XCTAssertFalse(record.exists)
        }
    }

    @MainActor
    func testArticleAndNoteRowsShowLongTitlesAndOpenTheirDestinations() throws {
        let app = XCUIApplication()
        app.launchArguments += ["-ui-testing-authenticated", "-ui-testing-list-fixtures", "-ui-testing-article-links", "-AppleLanguages", "(ja)"]
        app.launch()

        let tabs = app.tabBars.firstMatch.buttons
        for (index, domain) in ["article", "note"].enumerated() {
            tabs.element(boundBy: index + 1).tap()
            app.buttons["status-filter"].tap()
            let shortRow = app.descendants(matching: .any)["domain-record-\(domain)-short"]
            let longRow = app.descendants(matching: .any)["domain-record-\(domain)-long"]
            XCTAssertTrue(shortRow.waitForExistence(timeout: 5))
            XCTAssertTrue(longRow.waitForExistence(timeout: 5))
            XCTAssertGreaterThan(longRow.frame.height, shortRow.frame.height)
            XCTAssertFalse(longRow.staticTexts["未公開"].exists)
            let screenshot = XCTAttachment(screenshot: app.screenshot())
            screenshot.name = "\(domain)-list"
            screenshot.lifetime = .keepAlways
            add(screenshot)
            longRow.tap()
            if domain == "article" {
                let url = app.staticTexts["opened-article-url"]
                XCTAssertTrue(url.waitForExistence(timeout: 5))
                XCTAssertEqual(url.label, "https://example.com/article-long")
                XCTAssertFalse(app.descendants(matching: .any)["record-pager"].exists)
            } else {
                let detail = app.descendants(matching: .any)["record-detail-notes"].firstMatch
                XCTAssertTrue(detail.waitForExistence(timeout: 5))
                XCTAssertFalse(detail.staticTexts["未公開"].exists)
                app.navigationBars.buttons.firstMatch.tap()
            }
        }
    }

    @MainActor
    func testArticleCategoryAndSwipeDeletionUpdateTheListAndTotal() {
        let app = XCUIApplication()
        app.launchArguments += ["-ui-testing-authenticated", "-ui-testing-list-fixtures", "-ui-testing-article-links", "-AppleLanguages", "(ja)"]
        app.launch()
        app.tabBars.buttons.element(boundBy: 1).tap()
        let status = app.buttons["status-filter"]
        XCTAssertEqual(status.label, "公開済み (0)")
        status.tap()
        let shortRow = app.buttons["domain-record-article-short"]
        let longRow = app.buttons["domain-record-article-long"]
        XCTAssertTrue(shortRow.waitForExistence(timeout: 5))
        let category = app.buttons["article-category-filter"]

        category.tap()
        app.buttons["Archive"].tap()
        XCTAssertTrue(shortRow.waitForNonExistence(timeout: 5))
        XCTAssertEqual(status.label, "未公開 (2)")
        XCTAssertTrue(longRow.exists)
        status.tap()
        XCTAssertTrue(longRow.waitForNonExistence(timeout: 5))
        status.tap()
        XCTAssertTrue(longRow.waitForExistence(timeout: 5))
        XCTAssertFalse(shortRow.exists)

        longRow.swipeLeft()
        app.buttons["削除"].tap()
        app.buttons["article-delete-confirm"].firstMatch.tap()
        XCTAssertTrue(app.alerts.firstMatch.waitForExistence(timeout: 5))
        app.alerts.buttons["OK"].tap()
        XCTAssertTrue(longRow.exists)
        XCTAssertEqual(status.label, "未公開 (2)")

        category.tap()
        app.buttons["Reading"].tap()
        XCTAssertTrue(shortRow.waitForExistence(timeout: 5))
        shortRow.swipeLeft()
        app.buttons["削除"].tap()
        XCTAssertTrue(app.buttons["article-delete-confirm"].firstMatch.waitForExistence(timeout: 5))
        if app.buttons["キャンセル"].exists {
            app.buttons["キャンセル"].tap()
        } else {
            let dismissRegion = app.otherElements["PopoverDismissRegion"]
            XCTAssertTrue(dismissRegion.waitForExistence(timeout: 5))
            dismissRegion.tap()
        }
        XCTAssertTrue(shortRow.exists)
        shortRow.swipeLeft()
        app.buttons["削除"].tap()
        app.buttons["article-delete-confirm"].firstMatch.tap()
        XCTAssertTrue(shortRow.waitForNonExistence(timeout: 5))
        XCTAssertEqual(status.label, "未公開 (1)")
    }

    @MainActor
    func testArticleAndNoteEmptyStatesDoNotCreateBlankRows() throws {
        let app = XCUIApplication()
        app.launchArguments += ["-ui-testing-authenticated", "-ui-testing-list-fixtures"]
        app.launch()

        let tabs = app.tabBars.firstMatch.buttons
        for (index, domain) in ["articles", "notes"].enumerated() {
            tabs.element(boundBy: index + 1).tap()
            let list = app.descendants(matching: .any)["domain-list-\(domain)"]
            let empty = app.staticTexts["domain-empty-\(domain)"]
            XCTAssertTrue(empty.waitForExistence(timeout: 5))
            XCTAssertEqual(list.cells.count, 0)
            XCTAssertFalse(app.descendants(matching: .any)["initial-loading"].exists)
            let screenshot = XCTAttachment(screenshot: app.screenshot())
            screenshot.name = "\(domain)-empty"
            screenshot.lifetime = .keepAlways
            add(screenshot)
        }
    }

    @MainActor
    func testNoteSaveClosesAfterLocalEnqueue() throws {
        let app = XCUIApplication()
        app.launchArguments += ["-ui-testing-authenticated", "-ui-testing-list-fixtures"]
        app.launch()

        app.tabBars.buttons.element(boundBy: 2).tap()
        app.buttons["create-button"].tap()
        let title = app.textFields["create-title-field"]
        XCTAssertTrue(title.waitForExistence(timeout: 5))
        title.tap()
        title.typeText("Saved offline")
        let save = app.buttons["save-button"]
        XCTAssertTrue(save.isEnabled)
        save.tap()
        XCTAssertFalse(title.waitForExistence(timeout: 2))
    }

    @MainActor
    func testBookCoversAlignAcrossColumnsWithDifferentTitleLengths() throws {
        let app = XCUIApplication()
        app.launchArguments += ["-ui-testing-authenticated", "-ui-testing-list-fixtures"]
        app.launch()

        app.tabBars.firstMatch.buttons.element(boundBy: 4).tap()
        app.buttons["status-filter"].tap()
        let short = app.descendants(matching: .any)["media-cell-book-short"]
        let long = app.descendants(matching: .any)["media-cell-book-long"]
        XCTAssertTrue(short.waitForExistence(timeout: 5))
        XCTAssertTrue(long.waitForExistence(timeout: 5))
        XCTAssertEqual(short.frame.minY, long.frame.minY, accuracy: 1)
        XCTAssertEqual(short.frame.height, long.frame.height, accuracy: 1)
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "books-aligned-grid"
        screenshot.lifetime = .keepAlways
        add(screenshot)
    }

    @MainActor
    private func enterText(_ text: String, into field: XCUIElement, in app: XCUIApplication, file: StaticString = #filePath, line: UInt = #line) {
        let hittable = XCTNSPredicateExpectation(predicate: NSPredicate(format: "isHittable == true"), object: field)
        XCTAssertEqual(XCTWaiter.wait(for: [hittable], timeout: 10), .completed, file: file, line: line)
        field.tap()
        // Sheet controls can appear before their first tap establishes keyboard focus on CI.
        if !app.keyboards.firstMatch.waitForExistence(timeout: 5) {
            field.tap()
        }
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 5), file: file, line: line)
        // Japanese UI launches can initially show the kana keyboard. Switch to
        // Latin input before typing these ASCII fixture values.
        let latinKeyboard = app.keyboards.buttons["ABC"]
        if latinKeyboard.exists { latinKeyboard.tap() }
        field.typeText(text)
        let entered = XCTNSPredicateExpectation(predicate: NSPredicate(format: "value == %@", text), object: field)
        XCTAssertEqual(XCTWaiter.wait(for: [entered], timeout: 5), .completed, file: file, line: line)
    }
}
