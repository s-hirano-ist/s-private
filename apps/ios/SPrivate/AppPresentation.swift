import SwiftUI

enum AppTypography {
    static let screenTitle = Font.system(.largeTitle, design: .serif, weight: .semibold)
    static let readingTitle = Font.system(.title, design: .serif, weight: .semibold)
    static let entryTitle = Font.system(.title3, design: .serif, weight: .semibold)
}

struct AppScreenHeading: View {
    let title: String

    init(_ title: String) {
        self.title = title
    }

    var body: some View {
        VStack(alignment: .leading, spacing: AppLayout.small) {
            Capsule()
                .fill(AppColors.primary)
                .frame(width: 28, height: 3)
                .accessibilityHidden(true)
            Text(title)
                .font(AppTypography.screenTitle)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityAddTraits(.isHeader)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .foregroundStyle(AppColors.foreground)
    }
}

struct ScrollNavigationMinimization: ViewModifier {
    var enabled: Bool
    @Environment(\.accessibilityVoiceOverEnabled) private var voiceOverEnabled

    func body(content: Content) -> some View {
        #if targetEnvironment(simulator)
        // The iOS 27.0 simulator exports the renamed SwiftUI API.
        content.toolbarMinimizationBehavior(enabled && !voiceOverEnabled ? .onScrollDown : .never, for: .navigationBar)
        #else
        // Some iOS 27.0 device builds lack the renamed SwiftUI symbol (FB25095054).
        if #available(iOS 27.1, *) {
            content.toolbarMinimizationBehavior(enabled && !voiceOverEnabled ? .onScrollDown : .never, for: .navigationBar)
        } else {
            content
        }
        #endif
    }
}

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

struct NavigationFilterMenu<Options: View>: View {
    let title: String
    let selection: String
    @ViewBuilder let options: () -> Options

    var body: some View {
        Menu(content: options) {
            HStack(spacing: AppLayout.tiny) {
                Text(selection)
                    .font(.caption.weight(.semibold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
                Image(systemName: "chevron.down")
                    .font(.caption2.weight(.semibold))
                    .accessibilityHidden(true)
            }
            .frame(minWidth: AppLayout.minimumTarget, maxWidth: 104, minHeight: AppLayout.minimumTarget)
        }
        .accessibilityLabel(title)
        .accessibilityValue(selection)
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
    func minimizeNavigationWhenScrolling(_ enabled: Bool = true) -> some View {
        modifier(ScrollNavigationMinimization(enabled: enabled))
    }

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

    func appHeadingRow() -> some View {
        appContentRow().listRowBackground(Color.clear)
    }

    func appScreenSurface() -> some View {
        scrollContentBackground(.hidden)
            .background(AppColors.background)
            .foregroundStyle(AppColors.foreground)
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
