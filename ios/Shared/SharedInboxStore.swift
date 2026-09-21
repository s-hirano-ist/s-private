import Foundation

enum SharedInboxStoreError: Error, Equatable {
    case appGroupUnavailable
    case duplicateOperation(UUID)
    case unsupportedSchema(Int)
}

struct SharedInboxStore {
    static let appGroupIdentifier = "group.ist.s-hirano.s-private"

    private let rootURL: URL
    private let fileManager: FileManager
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder

    init(
        containerURL: URL? = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: Self.appGroupIdentifier
        ),
        fileManager: FileManager = .default
    ) throws {
        guard let containerURL else {
            throw SharedInboxStoreError.appGroupUnavailable
        }

        rootURL = containerURL.appending(path: "SharedInbox", directoryHint: .isDirectory)
        self.fileManager = fileManager
        encoder = JSONEncoder()
        decoder = JSONDecoder()
        encoder.dateEncodingStrategy = .iso8601
        decoder.dateDecodingStrategy = .iso8601

        try fileManager.createDirectory(at: pendingURL, withIntermediateDirectories: true)
        try fileManager.createDirectory(at: importedURL, withIntermediateDirectories: true)
    }

    func save(_ item: SharedInboxItem, attachmentData: Data? = nil) throws {
        try validate(item)

        let finalURL = pendingURL.appending(path: item.operationID.uuidString, directoryHint: .isDirectory)
        let alreadyImportedURL = importedURL.appending(
            path: item.operationID.uuidString,
            directoryHint: .isDirectory
        )
        guard !fileManager.fileExists(atPath: finalURL.path),
              !fileManager.fileExists(atPath: alreadyImportedURL.path)
        else {
            throw SharedInboxStoreError.duplicateOperation(item.operationID)
        }

        let temporaryURL = rootURL.appending(
            path: ".tmp-\(item.operationID.uuidString)",
            directoryHint: .isDirectory
        )
        try? fileManager.removeItem(at: temporaryURL)
        try fileManager.createDirectory(at: temporaryURL, withIntermediateDirectories: true)

        do {
            if let attachmentData, let relativePath = item.attachmentRelativePath {
                let attachmentURL = temporaryURL.appending(path: relativePath)
                try fileManager.createDirectory(
                    at: attachmentURL.deletingLastPathComponent(),
                    withIntermediateDirectories: true
                )
                try attachmentData.write(to: attachmentURL, options: .atomic)
            }

            let metadata = try encoder.encode(item)
            try metadata.write(to: temporaryURL.appending(path: "item.json"), options: .atomic)
            try fileManager.moveItem(at: temporaryURL, to: finalURL)
        } catch {
            try? fileManager.removeItem(at: temporaryURL)
            throw error
        }
    }

    @discardableResult
    func importPending() throws -> [SharedInboxItem] {
        let operationDirectories = try contents(of: pendingURL)
        var imported: [SharedInboxItem] = []

        for sourceURL in operationDirectories {
            let item = try decodeItem(in: sourceURL)
            let destinationURL = importedURL.appending(
                path: item.operationID.uuidString,
                directoryHint: .isDirectory
            )

            if fileManager.fileExists(atPath: destinationURL.path) {
                try fileManager.removeItem(at: sourceURL)
                continue
            }

            try fileManager.moveItem(at: sourceURL, to: destinationURL)
            imported.append(item)
        }

        return imported.sorted { $0.createdAt > $1.createdAt }
    }

    func loadImported() throws -> [SharedInboxItem] {
        try contents(of: importedURL)
            .map(decodeItem(in:))
            .sorted { $0.createdAt > $1.createdAt }
    }

    private var pendingURL: URL {
        rootURL.appending(path: "Pending", directoryHint: .isDirectory)
    }

    private var importedURL: URL {
        rootURL.appending(path: "Imported", directoryHint: .isDirectory)
    }

    private func contents(of directoryURL: URL) throws -> [URL] {
        try fileManager.contentsOfDirectory(
            at: directoryURL,
            includingPropertiesForKeys: [.isDirectoryKey],
            options: [.skipsHiddenFiles]
        )
    }

    private func decodeItem(in directoryURL: URL) throws -> SharedInboxItem {
        let data = try Data(contentsOf: directoryURL.appending(path: "item.json"))
        let item = try decoder.decode(SharedInboxItem.self, from: data)
        try validate(item)
        return item
    }

    private func validate(_ item: SharedInboxItem) throws {
        guard item.schemaVersion == SharedInboxItem.currentSchemaVersion else {
            throw SharedInboxStoreError.unsupportedSchema(item.schemaVersion)
        }
    }
}
