import Foundation
import ZIPFoundation

struct RssImportBatch: Sendable {
    enum Kind: Sendable { case opml, starred }
    let kind: Kind
    let content: String
}

enum RssError: LocalizedError {
    case invalidImport, fileTooLarge, changingPages, offline, incompleteCache
    var errorDescription: String? {
        switch self {
        case .invalidImport: String(localized: "Inoreader ZIP、OPML、starred.jsonを選択してください")
        case .fileTooLarge: String(localized: "取り込みファイルが大きすぎます")
        case .changingPages: String(localized: "記事一覧が変更されました。再試行してください")
        case .offline: String(localized: "オフラインです。保存した記事情報を表示しています")
        case .incompleteCache: String(localized: "全件取得が完了してから再試行してください")
        }
    }
}

enum RssImport {
    static let maxFileBytes = 50 * 1_024 * 1_024
    static let maxExpandedBytes = 32 * 1_024 * 1_024
    static let maxContentCharacters = 2_000_000

    static func read(_ url: URL) throws -> [RssImportBatch] {
        let access = url.startAccessingSecurityScopedResource()
        defer { if access { url.stopAccessingSecurityScopedResource() } }
        let size = try url.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0
        guard size <= maxFileBytes else { throw RssError.fileTooLarge }
        if url.pathExtension.lowercased() != "zip" {
            guard size <= maxExpandedBytes else { throw RssError.fileTooLarge }
            let data = try Data(contentsOf: url)
            guard data.count <= maxExpandedBytes else { throw RssError.fileTooLarge }
            let kind = try kind(for: url.lastPathComponent, standalone: true)
            return try batches(data, kind: kind)
        }
        let archive = try Archive(url: url, accessMode: .read)
        var expanded = 0
        var entries = 0
        var result: [RssImportBatch] = []
        for entry in archive {
            try Task.checkCancellation()
            entries += 1
            guard entries <= 10_000 else { throw RssError.fileTooLarge }
            guard entry.type == .file, let kind = try? kind(for: entry.path, standalone: false) else { continue }
            guard entry.uncompressedSize <= UInt64(maxExpandedBytes - expanded) else { throw RssError.fileTooLarge }
            var data = Data()
            _ = try archive.extract(entry) { chunk in
                try Task.checkCancellation()
                expanded += chunk.count
                guard expanded <= maxExpandedBytes else { throw RssError.fileTooLarge }
                data.append(chunk)
            }
            result += try batches(data, kind: kind)
        }
        guard !result.isEmpty else { throw RssError.invalidImport }
        return result
    }

    private static func kind(for name: String, standalone: Bool) throws -> RssImportBatch.Kind {
        let name = name.split(separator: "/").last?.lowercased() ?? ""
        if name == "subscriptions.xml" || name.hasSuffix(".opml") || (standalone && name.hasSuffix(".xml")) {
            return .opml
        }
        if name == "starred.json" { return .starred }
        throw RssError.invalidImport
    }

    static func batches(_ data: Data, kind: RssImportBatch.Kind) throws -> [RssImportBatch] {
        guard data.count <= maxExpandedBytes else { throw RssError.fileTooLarge }
        if kind == .opml {
            guard let content = String(data: data, encoding: .utf8) else { throw RssError.invalidImport }
            guard content.utf16.count <= maxContentCharacters else { throw RssError.fileTooLarge }
            return [.init(kind: .opml, content: content)]
        }
        let root = try JSONSerialization.jsonObject(with: data)
        guard let items = (root as? [String: Any])?["items"] as? [Any] ?? root as? [Any] else {
            throw RssError.invalidImport
        }
        // Never transmit or persist article bodies from an Inoreader export.
        let fields = Set(["title", "canonical", "alternate", "url", "published"])
        let metadata: [[String: Any]] = items.map { item in
            (item as? [String: Any] ?? [:]).filter { fields.contains($0.key) }
        }
        var result: [RssImportBatch] = []
        var pending: [[String: Any]] = []
        func encoded(_ entries: [[String: Any]]) throws -> String {
            String(decoding: try JSONSerialization.data(withJSONObject: ["items": entries]), as: UTF8.self)
        }
        for item in metadata {
            try Task.checkCancellation()
            let candidate = try encoded(pending + [item])
            if candidate.utf16.count > maxContentCharacters || pending.count == 100 {
                guard !pending.isEmpty else { throw RssError.fileTooLarge }
                result.append(.init(kind: .starred, content: try encoded(pending)))
                pending = []
            }
            pending.append(item)
            guard try encoded(pending).utf16.count <= maxContentCharacters else { throw RssError.fileTooLarge }
        }
        if !pending.isEmpty { result.append(.init(kind: .starred, content: try encoded(pending))) }
        return result
    }
}
