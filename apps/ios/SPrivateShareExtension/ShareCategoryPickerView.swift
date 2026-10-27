import SwiftUI

struct ShareCategoryPickerView: View {
    let categories: [String]
    let onSelect: (String) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var name: String
    @State private var search = ""

    init(categories: [String], selected: String, onSelect: @escaping (String) -> Void) {
        self.categories = categories
        self.onSelect = onSelect
        _name = State(initialValue: selected)
    }

    private var filteredCategories: [String] {
        guard !search.isEmpty else { return categories }
        return categories.filter { $0.localizedStandardContains(search) }
    }

    var body: some View {
        NavigationStack {
            List {
                Section(String(localized: "新しいカテゴリ")) {
                    TextField(String(localized: "カテゴリ名"), text: $name)
                        .accessibilityIdentifier("shared-category-name-field")
                    if !name.isEmpty && !ArticleCategoryName.isValid(name) {
                        Text(String(localized: "カテゴリ名は1〜16文字で入力してください"))
                            .foregroundStyle(.red)
                    }
                    Button(String(localized: "この名前を使用")) { select(name) }
                        .disabled(!ArticleCategoryName.isValid(name))
                }
                if !filteredCategories.isEmpty {
                    Section(String(localized: "既存カテゴリ")) {
                        ForEach(filteredCategories, id: \.self) { category in
                            Button {
                                select(category)
                            } label: {
                                HStack {
                                    Text(category)
                                    if category == ArticleCategoryName.normalized(name) {
                                        Spacer()
                                        Image(systemName: "checkmark")
                                    }
                                }
                            }
                        }
                    }
                }
            }
            .searchable(text: $search)
            .navigationTitle(String(localized: "カテゴリ"))
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(String(localized: "キャンセル")) { dismiss() }
                }
            }
        }
    }

    private func select(_ value: String) {
        onSelect(ArticleCategoryName.normalized(value))
        dismiss()
    }
}
