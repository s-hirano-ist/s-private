import SwiftUI

struct RssReaderView: View {
    @Environment(RssReaderModel.self) private var rss
    @Environment(\.openURL) private var openURL
    @Environment(\.scenePhase) private var scenePhase
    @State private var list = RssList.unread
    @State private var feedID = ""
    @State private var page = 0
    @State private var acceptedIDs: Set<String> = []
    @State private var initialized = false
    @State private var readAll: [RssEntry]?

    private var entries: [RssEntry] {
        if list == .saved { return rss.snapshot.saved }
        return rss.snapshot.unread.filter {
            (!initialized || acceptedIDs.contains($0.id)) && (feedID.isEmpty || $0.feedID == feedID)
        }
    }
    private var newCount: Int {
        guard initialized else { return 0 }
        return rss.snapshot.unread.filter {
            !(!initialized || acceptedIDs.contains($0.id)) && (feedID.isEmpty || $0.feedID == feedID)
        }.count
    }
    private var pageCount: Int { max(1, (entries.count + 49) / 50) }
    private var effectivePage: Int { min(page, pageCount - 1) }
    private var visible: [RssEntry] { Array(entries.dropFirst(effectivePage * 50).prefix(50)) }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Picker(String(localized: "RSSの表示"), selection: $list) {
                        ForEach(RssList.allCases) { Text($0.title).tag($0) }
                    }
                    .pickerStyle(.segmented)
                    .accessibilityIdentifier("rss-view-picker")
                    if list == .unread {
                        Picker(String(localized: "購読で絞り込み"), selection: $feedID) {
                            Text(String(localized: "すべての購読")).tag("")
                            ForEach(rss.snapshot.feeds) { Text($0.label).tag($0.id) }
                        }
                        .accessibilityIdentifier("rss-feed-filter")
                    }
                    RssStatusView()
                    if list == .unread && newCount > 0 {
                        Button(String(format: String(localized: "新着 %lld件を表示"), newCount)) { acceptNew() }
                            .accessibilityIdentifier("rss-show-new")
                    }
                    Text(String(format: String(localized: "%lld件"), entries.count))
                        .font(.caption).foregroundStyle(AppColors.mutedForeground)
                        .accessibilityIdentifier("rss-count")
                }
                .listRowBackground(AppColors.background)
                if entries.isEmpty && rss.isLoading {
                    ForEach(0..<6) { _ in
                        LoadingContent { SkeletonText() }
                            .listRowBackground(AppColors.background)
                    }
                }
                ForEach(visible) { entry in
                    RssEntryRow(entry: entry, source: source(entry), canSave: rss.canMutate) {
                        guard let url = entry.link else { return }
                        let scope = rss.scope
                        let shouldMarkRead = rss.isOnline && entry.feedID != nil
                        openURL(url) { accepted in
                            if accepted && shouldMarkRead && rss.scope == scope {
                                Task { await rss.markRead([entry]) }
                            }
                        }
                    } onSave: {
                        Task { await rss.toggleSaved(entry) }
                    }
                    .listRowBackground(AppColors.background)
                }
                if entries.isEmpty && !rss.isLoading {
                    ContentUnavailableView(
                        list == .unread ? String(localized: "未読記事はありません") : String(localized: "保存した記事はありません"),
                        systemImage: list == .unread ? "checkmark.circle" : "star"
                    )
                    .listRowBackground(AppColors.background)
                    .accessibilityIdentifier("rss-empty")
                }
                if pageCount > 1 { pagination }
            }
            .listStyle(.plain)
            .scrollContentBackground(.hidden)
            .background(AppColors.background)
            .foregroundStyle(AppColors.foreground)
            .accessibilityIdentifier("rss-reader")
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    if list == .unread {
                        Button(String(localized: "すべて既読"), systemImage: "checkmark.circle") { readAll = entries }
                            .disabled(!rss.canMutate || !rss.isComplete || entries.isEmpty)
                            .accessibilityIdentifier("rss-read-all")
                    }
                }
                ToolbarItemGroup(placement: .topBarTrailing) {
                    Button(String(localized: "更新"), systemImage: "arrow.clockwise") {
                        Task { await rss.synchronize(manual: true) }
                    }
                    .disabled(!rss.isOnline || rss.isLoading || rss.isMutating)
                    .accessibilityIdentifier("rss-refresh")
                    NavigationLink {
                        SettingsView()
                    } label: {
                        Label(String(localized: "設定"), systemImage: "gearshape")
                    }
                    .accessibilityIdentifier("settings-link")
                }
            }
            .confirmationDialog(
                String(localized: "表示中の購読の記事をすべて既読にしますか？"),
                isPresented: Binding(get: { readAll != nil }, set: { if !$0 { readAll = nil } }),
                titleVisibility: .visible
            ) {
                Button(String(localized: "すべて既読"), role: .destructive) {
                    let captured = readAll ?? []
                    readAll = nil
                    Task { await rss.markRead(captured) }
                }
                Button(String(localized: "キャンセル"), role: .cancel) { readAll = nil }
            }
            .refreshable { await rss.synchronize(manual: true) }
            .task(id: rss.scope) {
                initialized = false
                acceptNew()
                await rss.synchronize()
                captureInitial()
            }
            .onChange(of: rss.dataRevision) { _, _ in
                captureInitial()
                if !feedID.isEmpty && !rss.snapshot.feeds.contains(where: { $0.id == feedID }) { feedID = "" }
                page = min(page, pageCount - 1)
            }
            .onChange(of: list) { _, _ in page = 0 }
            .onChange(of: feedID) { _, _ in page = 0 }
            .onChange(of: rss.isOnline) { _, online in if online { Task { await rss.synchronize() } } }
            .task(id: scenePhase) {
                guard scenePhase == .active else { return }
                while !Task.isCancelled {
                    do { try await Task.sleep(for: .seconds(300)) } catch { return }
                    guard !Task.isCancelled else { return }
                    await rss.synchronize()
                }
            }
            .onChange(of: scenePhase) { _, phase in if phase == .active { Task { await rss.synchronize() } } }
        }
    }
    private var pagination: some View {
        HStack {
            Button(String(localized: "前へ")) { page = max(0, effectivePage - 1) }.disabled(effectivePage == 0)
            Spacer()
            Text("\(effectivePage * 50 + 1)–\(min((effectivePage + 1) * 50, entries.count)) / \(entries.count)")
                .font(.caption).monospacedDigit()
            Spacer()
            Button(String(localized: "次へ")) { page = effectivePage + 1 }.disabled(effectivePage + 1 >= pageCount)
        }
        .listRowBackground(AppColors.background)
    }
    private func source(_ entry: RssEntry) -> String {
        rss.snapshot.feeds.first { $0.id == entry.feedID }?.title ?? entry.link?.host() ?? ""
    }
    private func acceptNew() {
        acceptedIDs = Set(rss.snapshot.unread.map(\.id))
        page = 0
        if rss.isComplete { initialized = true }
    }
    private func captureInitial() { if !initialized { acceptNew() } }
}

private struct RssEntryRow: View {
    let entry: RssEntry
    let source: String
    let canSave: Bool
    let onOpen: () -> Void
    let onSave: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Button(action: onOpen) {
                HStack(alignment: .top, spacing: 12) {
                    if let value = entry.imageURL, let url = URL(string: value), url.scheme == "https" {
                        RemoteImageView(url: url, label: entry.title, thumbnail: true)
                    }
                    VStack(alignment: .leading, spacing: 6) {
                        Text(entry.title).font(.body).multilineTextAlignment(.leading)
                        Text(source).font(.caption).foregroundStyle(AppColors.mutedForeground)
                        if let date = entry.publishedAt {
                            Text(date, style: .date).font(.caption).foregroundStyle(AppColors.mutedForeground)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .foregroundStyle(AppColors.foreground)
            }
            .buttonStyle(.plain)
            .disabled(entry.link == nil)
            .accessibilityIdentifier("rss-entry-\(entry.id)")
            Button(action: onSave) {
                Label(
                    entry.savedID == nil ? String(localized: "あとで読むに保存") : String(localized: "保存を解除"),
                    systemImage: entry.savedID == nil ? "star" : "star.fill"
                )
                .labelStyle(.iconOnly).frame(minWidth: 44, minHeight: 44)
            }
            .buttonStyle(.borderless)
            .disabled(!canSave)
            .accessibilityIdentifier("rss-save-\(entry.id)")
        }
        .padding(.vertical, 6)
    }
}

struct RssStatusView: View {
    @Environment(RssReaderModel.self) private var rss
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if !rss.isOnline {
                Label(String(localized: "オフラインです。保存した記事情報を表示しています"), systemImage: "wifi.slash")
                    .font(.caption).accessibilityIdentifier("rss-offline")
            }
            ZStack(alignment: .leading) {
                // Reserve the same status line before, during and after refresh.
                Text(" ").font(.caption).accessibilityHidden(true)
                if rss.isMutating {
                    ProgressView().controlSize(.small)
                        .accessibilityIdentifier("rss-loading")
                } else if rss.isLoading {
                    Text(rss.totalFeeds > 0 ? "\(rss.completedFeeds) / \(rss.totalFeeds)" : String(localized: "読み込み中"))
                        .font(.caption).foregroundStyle(AppColors.mutedForeground)
                        .accessibilityIdentifier("rss-loading")
                }
            }
            if let error = rss.errorMessage {
                Text(error).font(.caption).foregroundStyle(AppColors.destructive).accessibilityIdentifier("rss-error")
                Button(String(localized: "再試行")) { Task { await rss.synchronize(manual: true) } }
                    .disabled(!rss.isOnline || rss.isLoading || rss.isMutating)
            }
            Text(rss.snapshot.fetchedAt.map {
                String(localized: "最終取得") + " " + $0.formatted(date: .abbreviated, time: .shortened)
            } ?? " ")
                .font(.caption).foregroundStyle(AppColors.mutedForeground)
                .accessibilityHidden(rss.snapshot.fetchedAt == nil)
        }
        .accessibilityElement(children: .contain)
    }
}
