import SwiftUI

struct RssSearchBar<Filters: View>: View {
    let prompt: LocalizedStringKey
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
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @FocusState private var isSearchFocused: Bool

    var body: some View {
        HStack(spacing: 0) {
            Image(systemName: "magnifyingglass")
                .font(.subheadline)
                .foregroundStyle(AppColors.mutedForeground)
                .padding(.leading, AppLayout.medium)
                .padding(.trailing, AppLayout.small)
                .onTapGesture { isSearchFocused = true }
                .accessibilityHidden(true)
            TextField(text: $query, prompt: Text(isSearchFocused && !dynamicType.isAccessibilitySize ? prompt : "検索")
                .foregroundStyle(AppColors.mutedForeground)) {
                Text(prompt)
            }
            .frame(minHeight: AppLayout.minimumTarget)
            .focused($isSearchFocused)
            .submitLabel(.search)
            .autocorrectionDisabled()
            .textInputAutocapitalization(.never)
            .onSubmit { isSearchFocused = false }
            .accessibilityLabel(Text(prompt))
            .accessibilityIdentifier(searchID)

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
            .buttonStyle(.plain)
            .menuIndicator(.hidden)
            .accessibilityLabel(filterLabel)
            .accessibilityValue(filterValue)
            .accessibilityIdentifier(filterID)
        }
        .frame(maxWidth: .infinity)
        .background {
            Capsule()
                .fill(AppColors.foreground.opacity(0.06))
                .padding(.vertical, isSearchFocused ? 0 : AppLayout.tiny)
        }
        .animation(reduceMotion ? nil : .easeInOut(duration: 0.22), value: isSearchFocused)
    }
}

struct RssSavedSearchControls: View {
    @Binding var filter: RssSavedFilter
    let isInterpreting: Bool
    let usedManualSearch: Bool
    let onEdit: () -> Void
    let onClear: () -> Void
    let onAI: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: AppLayout.small) {
            RssSearchBar(
                prompt: "保存済み記事を検索",
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
