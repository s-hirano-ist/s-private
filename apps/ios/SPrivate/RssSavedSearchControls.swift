import SwiftUI
import UIKit

struct RssSearchBar<Filters: View>: View {
    let prompt: String
    @Binding var query: String
    let searchID: String
    let filterID: String
    let filterLabel: String
    let filterValue: String
    let hasFilter: Bool
    let clearID: String
    var onClear: (() -> Void)?
    @ViewBuilder let filters: () -> Filters

    @Environment(\.dynamicTypeSize) private var dynamicType

    var body: some View {
        HStack(spacing: 0) {
            Image(systemName: "magnifyingglass")
                .font(.subheadline)
                .foregroundStyle(AppColors.mutedForeground)
                .padding(.leading, AppLayout.medium)
                .padding(.trailing, AppLayout.small)
                .accessibilityHidden(true)
            RssToolbarSearchField(
                query: $query,
                placeholder: dynamicType.isAccessibilitySize ? String(localized: "検索") : prompt,
                label: prompt,
                identifier: searchID
            )
            .frame(minHeight: AppLayout.minimumTarget)

            if let onClear {
                Button(action: onClear) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(AppColors.mutedForeground)
                        .appTapTarget()
                }
                .buttonStyle(.plain)
                .accessibilityLabel(Text("絞り込みを解除"))
                .accessibilityIdentifier(clearID)
            }

            Menu(content: filters) {
                Image(systemName: hasFilter ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
                    .font(.title3)
                    .foregroundStyle(hasFilter ? AppColors.primary : AppColors.mutedForeground)
                    .appTapTarget()
            }
            .menuStyle(.button)
            .buttonStyle(.plain)
            .menuIndicator(.hidden)
            .accessibilityLabel(filterLabel)
            .accessibilityValue(filterValue)
            .accessibilityIdentifier(filterID)
        }
        .frame(maxWidth: .infinity)
    }
}

private struct RssToolbarSearchField: UIViewRepresentable {
    @Binding var query: String
    let placeholder: String
    let label: String
    let identifier: String

    func makeUIView(context: Context) -> UITextField {
        let field = ToolbarTextField()
        field.font = .preferredFont(forTextStyle: .body)
        field.adjustsFontForContentSizeCategory = true
        field.returnKeyType = .search
        field.autocorrectionType = .no
        field.autocapitalizationType = .none
        field.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
        field.setContentHuggingPriority(.defaultLow, for: .horizontal)
        field.accessibilityLabel = label
        field.accessibilityIdentifier = identifier
        field.delegate = context.coordinator
        field.addTarget(context.coordinator, action: #selector(Coordinator.queryChanged(_:)), for: .editingChanged)
        return field
    }

    func updateUIView(_ field: UITextField, context: Context) {
        context.coordinator.query = $query
        if field.markedTextRange == nil, field.text != query { field.text = query }
        if field.attributedPlaceholder?.string != placeholder {
            field.attributedPlaceholder = NSAttributedString(
                string: placeholder, attributes: [.foregroundColor: UIColor(AppColors.mutedForeground)]
            )
        }
    }

    func makeCoordinator() -> Coordinator { Coordinator(query: $query) }

    private final class ToolbarTextField: UITextField {
        private var requestedFocus = false

        override func didMoveToWindow() {
            super.didMoveToWindow()
            guard window != nil, !requestedFocus else { return }
            // SwiftUI's toolbar uses a separate host from the reader's focus system.
            DispatchQueue.main.async { [weak self] in
                guard let self, window != nil, !requestedFocus else { return }
                requestedFocus = becomeFirstResponder()
            }
        }
    }

    final class Coordinator: NSObject, UITextFieldDelegate {
        var query: Binding<String>

        init(query: Binding<String>) { self.query = query }

        @objc func queryChanged(_ field: UITextField) { query.wrappedValue = field.text ?? "" }

        func textFieldShouldReturn(_ textField: UITextField) -> Bool {
            textField.resignFirstResponder()
            return false
        }
    }
}

struct RssSavedSearchControls: View {
    @Binding var filter: RssSavedFilter
    let isInterpreting: Bool
    let onEdit: () -> Void
    let onClear: () -> Void
    let onAI: () -> Void

    var body: some View {
        RssSearchBar(
            prompt: String(localized: "保存済み記事を検索"),
            query: Binding(
                get: { filter.query },
                set: {
                    onEdit()
                    filter.query = $0
                    filter.alternatives = []
                }
            ),
            searchID: "rss-saved-search",
            filterID: "rss-saved-topic",
            filterLabel: String(localized: "カテゴリで絞り込む"),
            filterValue: filter.topic?.title ?? String(localized: "すべてのカテゴリ"),
            hasFilter: filter.topic != nil || !filter.alternatives.isEmpty,
            clearID: "rss-saved-clear",
            onClear: filter.isActive || isInterpreting ? onClear : nil
        ) {
            Section {
                Picker("カテゴリで絞り込む", selection: Binding(
                    get: { filter.topic },
                    set: { onEdit(); filter.topic = $0 }
                )) {
                    Text("すべてのカテゴリ").tag(nil as RssSavedTopic?)
                    ForEach(RssSavedTopic.allCases, id: \.self) { topic in
                        Text(topic.title).tag(Optional(topic))
                    }
                }
                .pickerStyle(.inline)
            }

            Button("AIで絞り込む", systemImage: "sparkles", action: onAI)
                .accessibilityIdentifier("rss-saved-ai")
        }
    }
}

struct RssSavedSearchPrompt: View {
    let onSubmit: (String) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var query = ""
    @FocusState private var focused: Bool

    var body: some View {
        NavigationStack {
            Form {
                TextField("例：SwiftUIの記事を探して", text: $query, axis: .vertical)
                    .accessibilityLabel("RSSの検索内容")
                    .accessibilityIdentifier("rss-saved-ai-query")
                    .lineLimit(2...5)
                    .focused($focused)
                    .onChange(of: query) { _, value in
                        if value.count > 300 { query = String(value.prefix(300)) }
                    }
            }
            .navigationTitle("AIで絞り込む")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("キャンセル") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("検索") {
                        onSubmit(query)
                        dismiss()
                    }
                    .disabled(RssSavedFilter.trim(query).isEmpty)
                    .accessibilityIdentifier("rss-saved-ai-submit")
                }
            }
            .task { focused = true }
        }
    }
}
