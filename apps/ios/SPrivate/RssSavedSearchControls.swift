import SwiftUI

struct RssSavedSearchControls: View {
    @Binding var filter: RssSavedFilter
    let isInterpreting: Bool
    let usedManualSearch: Bool
    let onEdit: () -> Void
    let onClear: () -> Void
    let onAI: () -> Void

    @Environment(\.dynamicTypeSize) private var dynamicType
    @FocusState private var isSearchFocused: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: AppLayout.small) {
            HStack {
                Image(systemName: "magnifyingglass").accessibilityHidden(true)
                TextField("保存済み記事を検索", text: Binding(
                    get: { filter.query },
                    set: {
                        onEdit()
                        filter.query = $0
                        filter.alternatives = []
                    }
                ))
                .focused($isSearchFocused)
                .submitLabel(.search)
                .onSubmit { isSearchFocused = false }
                .accessibilityIdentifier("rss-saved-search")
            }
            .padding(.horizontal, AppLayout.medium)
            .appTapTarget()
            .background(AppColors.foreground.opacity(0.06), in: RoundedRectangle(cornerRadius: 10))

            let layout = dynamicType.isAccessibilitySize ? AnyLayout(VStackLayout(alignment: .leading)) : AnyLayout(HStackLayout())
            layout {
                Picker("カテゴリで絞り込む", selection: Binding(
                    get: { filter.topic },
                    set: { onEdit(); filter.topic = $0 }
                )) {
                    Text("すべてのカテゴリ").tag(nil as RssSavedTopic?)
                    ForEach(RssSavedTopic.allCases, id: \.self) { topic in
                        Text(topic.title).tag(Optional(topic))
                    }
                }
                .pickerStyle(.menu)
                .labelsHidden()
                .appTapTarget()
                .accessibilityIdentifier("rss-saved-topic")

                Button {
                    isSearchFocused = false
                    onAI()
                } label: {
                    Label("AIで絞り込む", systemImage: "sparkles")
                }
                .buttonStyle(.borderless)
                .appTapTarget()
                .accessibilityIdentifier("rss-saved-ai")
            }

            if isInterpreting {
                ProgressView("検索条件を解析中")
                    .accessibilityIdentifier("rss-saved-ai-progress")
            }
            if !filter.alternatives.isEmpty {
                Text(String(format: String(localized: "AIの検索語: %@"), filter.alternatives.joined(separator: " / ")))
                    .font(.caption)
                    .foregroundStyle(AppColors.mutedForeground)
                    .accessibilityIdentifier("rss-saved-ai-terms")
            }
            if usedManualSearch {
                Text("AIで条件を作成できなかったため、入力文でキーワード検索しました。")
                    .font(.caption)
                    .foregroundStyle(AppColors.mutedForeground)
                    .accessibilityIdentifier("rss-saved-ai-fallback")
            }
            if filter.isActive || isInterpreting {
                Button("絞り込みを解除", action: onClear)
                    .buttonStyle(.borderless)
                    .appTapTarget()
                    .accessibilityIdentifier("rss-saved-clear")
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, AppLayout.inset)
        .padding(.vertical, AppLayout.medium)
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
