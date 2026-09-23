import SwiftUI

struct MarkdownBlock: Identifiable {
    enum Kind {
        case heading(Int, String)
        case paragraph(String)
        case list([String])
        case code(String)
        case table([[String]])
        case image(String, URL)
    }
    let id: Int
    let kind: Kind
}

enum NativeMarkdownParser {
    static func parse(_ source: String) -> [MarkdownBlock] {
        let lines = source.components(separatedBy: .newlines)
        var blocks: [MarkdownBlock] = []
        var index = 0
        while index < lines.count {
            let line = lines[index]
            defer { index += 1 }
            if line.trimmingCharacters(in: .whitespaces).isEmpty { continue }
            let id = index
            if line.hasPrefix("```") {
                var code: [String] = []
                index += 1
                while index < lines.count && !lines[index].hasPrefix("```") {
                    code.append(lines[index])
                    index += 1
                }
                blocks.append(MarkdownBlock(id: id, kind: .code(code.joined(separator: "\n"))))
            } else if let level = (1...6).first(where: { line.hasPrefix(String(repeating: "#", count: $0) + " ") }) {
                blocks.append(MarkdownBlock(id: id, kind: .heading(level, String(line.dropFirst(level + 1)))))
            } else if line.hasPrefix("!["), let close = line.range(of: "]("), line.hasSuffix(")"),
                      let url = URL(string: String(line[close.upperBound..<line.index(before: line.endIndex)])),
                      ["https", "http"].contains(url.scheme?.lowercased() ?? "") {
                blocks.append(MarkdownBlock(id: id, kind: .image(String(line[line.index(line.startIndex, offsetBy: 2)..<close.lowerBound]), url)))
            } else if line.hasPrefix("- ") || line.hasPrefix("* ") {
                var items = [String(line.dropFirst(2))]
                while index + 1 < lines.count && (lines[index + 1].hasPrefix("- ") || lines[index + 1].hasPrefix("* ")) {
                    index += 1
                    items.append(String(lines[index].dropFirst(2)))
                }
                blocks.append(MarkdownBlock(id: id, kind: .list(items)))
            } else if line.hasPrefix("|") {
                var rows = [[String]]()
                while index < lines.count && lines[index].hasPrefix("|") {
                    let cells = lines[index].split(separator: "|", omittingEmptySubsequences: false)
                        .dropFirst().dropLast().map { $0.trimmingCharacters(in: .whitespaces) }
                    if !cells.allSatisfy({ $0.allSatisfy { $0 == "-" || $0 == ":" || $0 == " " } }) {
                        rows.append(cells)
                    }
                    index += 1
                }
                index -= 1
                blocks.append(MarkdownBlock(id: id, kind: .table(rows)))
            } else {
                blocks.append(MarkdownBlock(id: id, kind: .paragraph(line)))
            }
        }
        return blocks
    }
}

struct NativeMarkdownView: View {
    let source: String

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            ForEach(NativeMarkdownParser.parse(source)) { block in
                switch block.kind {
                case let .heading(level, text):
                    markdownText(text).font(level == 1 ? .title2.bold() : level == 2 ? .title3.bold() : .headline)
                        .accessibilityAddTraits(.isHeader)
                case let .paragraph(text):
                    markdownText(text).textSelection(.enabled)
                case let .list(items):
                    VStack(alignment: .leading, spacing: 4) {
                        ForEach(items.indices, id: \.self) { index in
                            HStack(alignment: .firstTextBaseline) {
                                Text("•")
                                markdownText(items[index])
                            }
                        }
                    }
                case let .code(code):
                    ScrollView(.horizontal) {
                        Text(code).font(.system(.body, design: .monospaced)).textSelection(.enabled)
                            .padding(8).frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .background(.quaternary, in: RoundedRectangle(cornerRadius: 8))
                case let .table(rows):
                    ScrollView(.horizontal) {
                        Grid(alignment: .leading) {
                            ForEach(rows.indices, id: \.self) { row in
                                GridRow {
                                    ForEach(rows[row].indices, id: \.self) { column in
                                        markdownText(rows[row][column]).padding(4)
                                    }
                                }
                                Divider()
                            }
                        }
                    }
                case let .image(label, url):
                    AsyncImage(url: url) { image in
                        image.resizable().scaledToFit().accessibilityLabel(label)
                    } placeholder: { ProgressView() }
                }
            }
        }
    }

    private func markdownText(_ source: String) -> Text {
        if let value = try? AttributedString(markdown: source) { return Text(value) }
        return Text(source)
    }
}
