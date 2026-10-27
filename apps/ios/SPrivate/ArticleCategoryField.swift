import SwiftUI

struct ArticleCategoryField: View {
    @Binding var name: String
    let categories: [MobileCategory]

    var body: some View {
        Section(String(localized: "カテゴリ")) {
            if !categories.isEmpty {
                Menu(String(localized: "既存カテゴリから選択")) {
                    ForEach(categories) { category in
                        Button(category.name) { name = category.name }
                    }
                }
                .foregroundStyle(AppColors.primary)
                .accessibilityIdentifier("existing-category-menu")
            }
            TextField(String(localized: "新しいカテゴリ名"), text: $name)
                .accessibilityIdentifier("category-name-field")
            if !name.isEmpty && !ArticleCategoryName.isValid(name) {
                Text(String(localized: "カテゴリ名は1〜16文字で入力してください"))
                    .font(.footnote)
                    .foregroundStyle(AppColors.destructive)
            }
        }
    }
}
