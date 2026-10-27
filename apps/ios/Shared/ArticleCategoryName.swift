import Foundation

enum ArticleCategoryName {
    static let maximumLength = 16

    static func normalized(_ value: String) -> String {
        value.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    static func isValid(_ value: String) -> Bool {
        let name = normalized(value)
        return !name.isEmpty && name.utf16.count <= maximumLength
    }
}
