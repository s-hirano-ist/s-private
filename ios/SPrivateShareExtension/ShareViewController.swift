import Social
import UniformTypeIdentifiers

final class ShareViewController: SLComposeServiceViewController {
    private var category = String(localized: "共有")
    override func isContentValid() -> Bool {
        !contentText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || hasSupportedAttachment
    }

    override func didSelectPost() {
        let extensionItems = extensionContext?.inputItems.compactMap { $0 as? NSExtensionItem } ?? []
        let enteredText = contentText.trimmingCharacters(in: .whitespacesAndNewlines)

        Task {
            do {
                let store = try SharedInboxStore()
                var savedAttachment = false

                for extensionItem in extensionItems {
                    for provider in extensionItem.attachments ?? [] {
                        if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier),
                           let url = try await loadURL(from: provider)
                        {
                            try store.save(
                                SharedInboxItem(kind: .url, text: url.absoluteString, title: enteredText.isEmpty ? url.host : enteredText, category: category)
                            )
                            savedAttachment = true
                        } else if provider.hasItemConformingToTypeIdentifier(UTType.image.identifier),
                                  let data = try await loadImageData(from: provider)
                        {
                            let operationID = UUID()
                            try store.save(
                                SharedInboxItem(
                                    operationID: operationID,
                                    kind: .image,
                                    text: enteredText.isEmpty ? nil : enteredText,
                                    title: enteredText.isEmpty ? String(localized: "共有画像") : enteredText,
                                    attachmentRelativePath: "attachments/shared-image"
                                ),
                                attachmentData: data
                            )
                            savedAttachment = true
                        }
                    }
                }

                if !enteredText.isEmpty, !savedAttachment {
                    try store.save(SharedInboxItem(kind: .text, text: enteredText, title: String(enteredText.prefix(64))))
                }

                await MainActor.run {
                    extensionContext?.completeRequest(returningItems: nil)
                }
            } catch {
                await MainActor.run {
                    let alert = UIAlertController(
                        title: "保存できませんでした",
                        message: error.localizedDescription,
                        preferredStyle: .alert
                    )
                    alert.addAction(UIAlertAction(title: "閉じる", style: .default))
                    present(alert, animated: true)
                }
            }
        }
    }

    override func configurationItems() -> [Any]! {
        let item = SLComposeSheetConfigurationItem()!
        item.title = String(localized: "カテゴリ")
        item.value = category
        item.tapHandler = { [weak self] in self?.chooseCategory() }
        return [item]
    }

    private func chooseCategory() {
        let alert = UIAlertController(title: String(localized: "カテゴリ"), message: nil, preferredStyle: .alert)
        alert.addTextField { $0.text = self.category }
        alert.addAction(UIAlertAction(title: String(localized: "保存"), style: .default) { [weak self, weak alert] _ in
            self?.category = alert?.textFields?.first?.text?.trimmingCharacters(in: .whitespacesAndNewlines).nonEmpty ?? String(localized: "共有")
            self?.reloadConfigurationItems()
        })
        alert.addAction(UIAlertAction(title: String(localized: "キャンセル"), style: .cancel))
        present(alert, animated: true)
    }

    private var hasSupportedAttachment: Bool {
        extensionContext?.inputItems
            .compactMap { $0 as? NSExtensionItem }
            .flatMap { $0.attachments ?? [] }
            .contains { provider in
                provider.hasItemConformingToTypeIdentifier(UTType.url.identifier)
                    || provider.hasItemConformingToTypeIdentifier(UTType.image.identifier)
            } ?? false
    }

    private func loadImageData(from provider: NSItemProvider) async throws -> Data? {
        try await withCheckedThrowingContinuation { continuation in
            provider.loadDataRepresentation(forTypeIdentifier: UTType.image.identifier) {
                data,
                error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume(returning: data)
                }
            }
        }
    }

    private func loadURL(from provider: NSItemProvider) async throws -> URL? {
        try await withCheckedThrowingContinuation { continuation in
            provider.loadObject(ofClass: NSURL.self) { object, error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume(returning: (object as? NSURL).map { $0 as URL })
                }
            }
        }
    }
}

private extension String {
    var nonEmpty: String? { isEmpty ? nil : self }
}
