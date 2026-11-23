import SwiftUI

struct RssReaderView: View {
    private static let displayBatchSize: Int = {
        #if DEBUG
        if RssFixtureClient.usesCompactScrollFixture { return 14 }
        #endif
        return 50
    }()

    @Environment(RssReaderModel.self) private var rss
    @Environment(\.openURL) private var openURL
    @Environment(\.scenePhase) private var scenePhase
    @State private var showingSubscribe = false
    @State private var list = RssList.unread
    @State private var feedID = ""
    @State private var visibleLimit = RssReaderView.displayBatchSize
    @State private var acceptedIDs: Set<String> = []
    @State private var initialized = false
    @State private var readAll: (entries: [RssEntry], identityID: UUID)?
    @State private var presentationIdentity = UUID()
    @State private var presentation = RssPresentation()
    @State private var acceptanceVersion = 0
    @State private var displayedKey: PresentationKey?

    private struct PresentationKey: Hashable {
        let identity: UUID
        let revision: Int
        let list: RssList
        let feedID: String
        let acceptance: Int
    }
    private var presentationKey: PresentationKey {
        .init(identity: rss.identityID, revision: rss.dataRevision, list: list, feedID: feedID, acceptance: acceptanceVersion)
    }

    private var presentationIsCurrent: Bool { displayedKey == presentationKey }

    private var entries: [RssEntry] { presentation.entries }
    private var newCount: Int { presentation.newCount }
    private var visible: [RssEntry] { Array(entries.prefix(visibleLimit)) }

    var body: some View {
        NavigationStack {
            ScrollViewReader { proxy in
                List {
                    Color.clear.frame(height: 0)
                        .listRowInsets(EdgeInsets())
                        .listRowSeparator(.hidden)
                        .accessibilityHidden(true)
                        .id("rss-top")
                    readerHeader
                        .listRowInsets(EdgeInsets())
                        .listRowSeparator(.hidden)
                        .listRowBackground(AppColors.background)
                    if entries.isEmpty && rss.isLoading {
                        ForEach(0..<6) { _ in
                            LoadingContent { SkeletonText() }
                                .appContentRow()
                        }
                    }
                    ForEach(visible) { entry in
                        let identity = presentationIdentity
                        RssEntryRow(entry: entry, source: source(entry), canSave: presentationIsCurrent && rss.canSave(entry), saving: rss.pendingKeys.contains("save:\(entry.url)")) {
                            guard presentationIsCurrent, rss.identityID == identity, let url = entry.link else { return }
                            openURL(url)
                        } onSave: {
                            guard presentationIsCurrent, rss.identityID == identity else { return }
                            let sessionID = rss.sessionID
                            Task { await rss.toggleSaved(entry, sessionID: sessionID) }
                        }
                        .appContentRow()
                    }
                    if visible.count < entries.count {
                        let limit = visibleLimit
                        Color.clear.frame(height: 1)
                            .appContentRow()
                            .accessibilityHidden(true)
                            .id(limit)
                            .task(id: displayedKey) {
                                guard !Task.isCancelled, presentationIsCurrent, visibleLimit == limit else { return }
                                visibleLimit += Self.displayBatchSize
                            }
                    }
                }
                .listStyle(.plain)
                .environment(\.defaultMinListRowHeight, 0)
                .accessibilityIdentifier("rss-reader")
                .refreshable { await rss.refresh(list) }
                .overlay {
                    if presentationIsCurrent && entries.isEmpty && !rss.isLoading && rss.errorMessage == nil {
                        readerEmptyState.accessibilityIdentifier("rss-empty")
                    }
                }
                .safeAreaInset(edge: .bottom, spacing: 0) { RssStatusView() }
                .scrollContentBackground(.hidden)
                .background(AppColors.background)
                .foregroundStyle(AppColors.foreground)
                .navigationTitle("")
                .navigationBarTitleDisplayMode(.inline)
                .minimizeNavigationWhenScrolling()
                .toolbar {
                    ToolbarItemGroup(placement: .topBarLeading) {
                        ContentStatusToggle(
                            title: list.title,
                            nextTitle: list == .unread ? String(localized: "保存済みに切り替え") : String(localized: "未読に切り替え"),
                            symbol: list == .unread ? "eye.slash" : "eye",
                            count: rss.totalCount(for: list)
                        ) { list = list == .unread ? .saved : .unread }
                        .accessibilityIdentifier("rss-status-filter")
                        if list == .unread {
                            Button { readAll = (entries, presentationIdentity) } label: {
                                BusyLabel(isBusy: rss.pendingKeys.contains(where: { $0.hasPrefix("read-") })) {
                                    Label(String(localized: "すべて既読"), systemImage: "checkmark.circle")
                                }
                            }
                                .labelStyle(.iconOnly)
                                .accessibilityLabel(rss.pendingKeys.contains(where: { $0.hasPrefix("read-") }) ? String(localized: "すべて既読") + ", " + String(localized: "処理中") : String(localized: "すべて既読"))
                                .disabled(!presentationIsCurrent || !rss.canMutate || !rss.isComplete || entries.isEmpty || rss.pendingKeys.contains(where: { $0.hasPrefix("read-") }))
                                .accessibilityIdentifier("rss-read-all")
                        }
                    }
                    ToolbarItemGroup(placement: .topBarTrailing) {
                        Button { Task { await rss.synchronize(manual: true) } } label: {
                            BusyLabel(isBusy: rss.isLoading) { Label(String(localized: "更新"), systemImage: "arrow.clockwise") }
                        }
                        .labelStyle(.iconOnly)
                        .accessibilityLabel(rss.isLoading ? String(localized: "更新") + ", " + String(localized: "処理中") : String(localized: "更新"))
                        .disabled(!rss.isOnline || rss.isLoading)
                        .accessibilityIdentifier("rss-refresh")
                        NavigationLink {
                            SettingsView()
                        } label: {
                            Label(String(localized: "設定"), systemImage: "gearshape")
                        }
                        .accessibilityIdentifier("settings-link")
                    }
                }
                .sheet(isPresented: $showingSubscribe) { RssSubscribeView() }
                .confirmationDialog(
                    String(localized: "表示中の購読の記事をすべて既読にしますか？"),
                    isPresented: Binding(get: { readAll != nil }, set: { if !$0 { readAll = nil } }),
                    titleVisibility: .visible
                ) {
                    Button(String(localized: "すべて既読"), role: .destructive) {
                        let captured = readAll
                        readAll = nil
                        if let captured, captured.identityID == rss.identityID {
                            let sessionID = rss.sessionID
                            Task { await rss.markRead(captured.entries, sessionID: sessionID) }
                        }
                    }
                    .disabled(!rss.canMutate)
                    Button(String(localized: "キャンセル"), role: .cancel) { readAll = nil }
                }
                .task(id: rss.scope) { await rss.synchronize() }
                .task(id: presentationKey) { await rebuild(presentationKey) }
                .onChange(of: rss.identityID) { _, _ in
                    readAll = nil
                    showingSubscribe = false
                    initialized = false
                    acceptedIDs = []
                    presentation = RssPresentation()
                    visibleLimit = Self.displayBatchSize
                    proxy.scrollTo("rss-top", anchor: .top)
                }
                .onChange(of: list) { _, _ in
                    visibleLimit = Self.displayBatchSize
                    proxy.scrollTo("rss-top", anchor: .top)
                }
                .onChange(of: acceptanceVersion) { _, _ in proxy.scrollTo("rss-top", anchor: .top) }
                .onChange(of: feedID) { _, _ in
                    visibleLimit = Self.displayBatchSize
                    proxy.scrollTo("rss-top", anchor: .top)
                }
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
    }
    @ViewBuilder
    private var readerHeader: some View {
        if list == .unread {
            VStack(alignment: .leading, spacing: AppLayout.medium) {
                Picker(String(localized: "購読で絞り込み"), selection: $feedID) {
                    Text(subscriptionLabel(String(localized: "すべての購読"), count: presentation.unreadCount)).tag("")
                    ForEach(rss.snapshot.feeds) { feed in
                        Text(subscriptionLabel(feed.label, count: presentation.unreadCounts[feed.id, default: 0])).tag(feed.id)
                    }
                }
                .pickerStyle(.menu)
                .labelsHidden()
                .appTapTarget()
                .accessibilityValue(subscriptionLabel(
                    rss.snapshot.feeds.first(where: { $0.id == feedID })?.label ?? String(localized: "すべての購読"),
                    count: feedID.isEmpty ? presentation.unreadCount : presentation.unreadCounts[feedID, default: 0]
                ))
                .accessibilityIdentifier("rss-feed-filter")
                if newCount > 0 {
                    Button(String(format: String(localized: "新着 %lld件を表示"), newCount)) {
                        initialized = false
                        acceptanceVersion += 1
                        visibleLimit = Self.displayBatchSize
                    }
                    .appTapTarget()
                    .buttonStyle(.borderless)
                    .disabled(!presentationIsCurrent)
                    .accessibilityIdentifier("rss-show-new")
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, AppLayout.inset)
            .padding(.vertical, AppLayout.medium)
        }
    }

    private func subscriptionLabel(_ title: String, count: Int) -> String {
        String(format: String(localized: "%@ (%lld)"), title, count)
    }

    @ViewBuilder
    private var readerEmptyState: some View {
        if list == .unread && rss.snapshot.feeds.isEmpty {
            AppEmptyState(title: String(localized: "購読はありません"), symbol: "dot.radiowaves.left.and.right",
                          message: String(localized: "お気に入りのサイトを追加して、記事を読み始めましょう。"),
                          actionTitle: String(localized: "購読を追加"), action: { showingSubscribe = true })
        } else if list == .unread {
            AppEmptyState(title: String(localized: "未読記事はありません"), symbol: "checkmark.circle",
                          message: String(localized: "新しい記事が届くと、ここに表示されます。"))
        } else {
            AppEmptyState(title: String(localized: "保存した記事はありません"), symbol: "star",
                          message: String(localized: "記事の星マークをタップすると、あとで読めるように保存できます。"))
        }
    }

    private func source(_ entry: RssEntry) -> String {
        entry.feedID.flatMap { presentation.sources[$0] } ?? entry.link?.host() ?? ""
    }
    private func rebuild(_ key: PresentationKey) async {
        let snapshot = rss.snapshot
        let accepted = acceptedIDs
        let wasInitialized = initialized && presentationIdentity == key.identity
        let complete = rss.isComplete
        // Capture value inputs on the UI actor, then build the full-list projection off it.
        let work = Task.detached(priority: .userInitiated) {
            let ids = wasInitialized ? accepted : Set(snapshot.unread.map(\.id))
            let value = RssPresentation(snapshot: snapshot, list: key.list, feedID: key.feedID, acceptedIDs: ids, initialized: true)
            return (value, ids)
        }
        let (value, ids) = await withTaskCancellationHandler { await work.value } onCancel: { work.cancel() }
        guard !Task.isCancelled, presentationKey == key else { return }
        presentationIdentity = key.identity
        displayedKey = key
        presentation = value
        acceptedIDs = ids
        if complete { initialized = true }
        if !feedID.isEmpty && !snapshot.feeds.contains(where: { $0.id == feedID }) { feedID = "" }
    }
}

private struct RssEntryRow: View {
    let entry: RssEntry
    let source: String
    let canSave: Bool
    let saving: Bool
    let onOpen: () -> Void
    let onSave: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: AppLayout.medium) {
            Button(action: onOpen) {
                HStack(alignment: .top, spacing: AppLayout.medium) {
                    if let value = entry.imageURL, let url = URL(string: value), url.scheme == "https" {
                        RssThumbnailView(url: url)
                    }
                    VStack(alignment: .leading, spacing: AppLayout.small) {
                        Text(entry.title).font(.headline).multilineTextAlignment(.leading)
                        ViewThatFits(in: .horizontal) {
                            HStack(spacing: AppLayout.small) { metadata }
                            VStack(alignment: .leading, spacing: AppLayout.tiny) { metadata }
                        }
                        .font(.caption)
                        .foregroundStyle(AppColors.mutedForeground)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .frame(minHeight: AppLayout.minimumTarget, alignment: .top)
                .contentShape(Rectangle())
                .foregroundStyle(AppColors.foreground)
            }
            .buttonStyle(.plain)
            .disabled(entry.link == nil)
            .accessibilityIdentifier("rss-entry-\(entry.id)")
            Button(action: onSave) {
                BusyLabel(isBusy: saving) {
                    Label(
                        entry.savedID == nil ? String(localized: "あとで読むに保存") : String(localized: "保存を解除"),
                        systemImage: entry.savedID == nil ? "star" : "star.fill"
                    )
                    .labelStyle(.iconOnly)
                }
                .appTapTarget()
            }
            .buttonStyle(.borderless)
            .accessibilityValue(saving ? String(localized: "処理中") : "")
            .disabled(!canSave)
            .accessibilityIdentifier("rss-save-\(entry.id)")
        }
    }
    @ViewBuilder
    private var metadata: some View {
        Text(source)
        if let date = entry.publishedAt { Text(date, style: .date) }
    }

}

struct RssStatusView: View {
    @Environment(RssReaderModel.self) private var rss
    var body: some View {
        if !rss.isOnline || rss.isLoading || rss.errorMessage != nil {
            VStack(alignment: .leading, spacing: AppLayout.small) {
                if !rss.isOnline {
                    Label(String(localized: "オフラインです。保存した記事情報を表示しています"), systemImage: "wifi.slash")
                        .accessibilityIdentifier("rss-offline")
                } else if rss.isLoading {
                    Text(String(localized: "記事情報を同期中"))
                        .accessibilityIdentifier("rss-loading")
                }
                if let error = rss.errorMessage {
                    Text(error).foregroundStyle(AppColors.destructive).accessibilityIdentifier("rss-error")
                    Button(String(localized: "再試行")) { Task { await rss.synchronize(manual: true) } }
                        .foregroundStyle(AppColors.primary)
                        .appTapTarget()
                        .disabled(!rss.isOnline || rss.isLoading)
                }
            }
            .font(.caption)
            .foregroundStyle(AppColors.mutedForeground)
            .padding(AppLayout.medium)
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: AppLayout.medium))
            .accessibilityElement(children: .contain)
            .padding(.horizontal, AppLayout.inset)
            .padding(.bottom, AppLayout.small)
        }
    }
}
