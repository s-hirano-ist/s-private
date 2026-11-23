import SwiftUI

struct ContentStatusToggle: View {
    let title: String
    let nextTitle: String
    let symbol: String
    let count: Int?
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: AppLayout.small) {
                Image(systemName: symbol)
                if let count {
                    Text(count, format: .number)
                        .font(.subheadline.monospacedDigit())
                }
            }
        }
        .accessibilityLabel(count.map {
            String(format: String(localized: "%@ (%lld)"), locale: .current, title, $0)
        } ?? title)
        .accessibilityHint(nextTitle)
    }
}

struct AppEmptyState: View {
    let title: String
    let symbol: String
    var message: String = ""
    var actionTitle: String?
    var action: (() -> Void)?

    var body: some View {
        ContentUnavailableView {
            Label(title, systemImage: symbol).foregroundStyle(AppColors.foreground)
        } description: {
            if !message.isEmpty { Text(message).foregroundStyle(AppColors.mutedForeground) }
        } actions: {
            if let actionTitle, let action {
                Button(actionTitle, action: action)
                    .appTapTarget()
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .tint(AppColors.primary)
                    .foregroundStyle(AppColors.primaryForeground)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(AppLayout.inset)
    }
}

extension View {
    /// Content is separated by whitespace; settings and forms keep native grouping.
    func appContentRow() -> some View {
        listRowInsets(
            EdgeInsets(
                top: AppLayout.medium, leading: AppLayout.inset,
                bottom: AppLayout.medium, trailing: AppLayout.inset)
        )
        .listRowSeparator(.hidden)
        .listRowBackground(AppColors.background)
    }
}

#Preview("Empty — Add content") {
    AppEmptyState(
        title: String(localized: "項目がありません"), symbol: "doc.text",
        message: String(localized: "新しい項目を登録すると、ここに表示されます。"),
        actionTitle: String(localized: "登録"), action: {})
}

#Preview("Empty — Saved articles") {
    AppEmptyState(
        title: String(localized: "保存した記事はありません"), symbol: "star",
        message: String(localized: "記事の星マークをタップすると、あとで読めるように保存できます。"))
}
