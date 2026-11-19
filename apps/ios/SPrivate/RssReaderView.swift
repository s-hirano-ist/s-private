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
                        Button(String(format: String(localized: "新着 %lld件を表示"), newCount)) {
                            initialized = false
                            acceptanceVersion += 1
                            page = 0
                        }
                        .disabled(!presentationIsCurrent)
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
                    let identity = presentationIdentity
                    RssEntryRow(entry: entry, source: source(entry), canSave: presentationIsCurrent && rss.canSave(entry), saving: rss.pendingKeys.contains("save:\(entry.url)")) {
                        guard presentationIsCurrent, rss.identityID == identity, let url = entry.link else { return }
                        let sessionID = rss.sessionID
                        let shouldMarkRead = rss.isOnline && entry.feedID != nil
                        openURL(url) { accepted in
                            if accepted && shouldMarkRead && rss.sessionID == sessionID {
                                Task { await rss.markRead([entry], sessionID: sessionID) }
                            }
                        }
                    } onSave: {
                        guard presentationIsCurrent, rss.identityID == identity else { return }
                        let sessionID = rss.sessionID
                        Task { await rss.toggleSaved(entry, sessionID: sessionID) }
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
                        Button { readAll = (entries, presentationIdentity) } label: {
                            BusyLabel(isBusy: rss.pendingKeys.contains(where: { $0.hasPrefix("read-") })) {
                                Label(String(localized: "すべて既読"), systemImage: "checkmark.circle")
                            }
                        }
                            .labelStyle(.iconOnly)
                            .disabled(!presentationIsCurrent || !rss.canMutate || !rss.isComplete || entries.isEmpty || rss.pendingKeys.contains(where: { $0.hasPrefix("read-") }))
                            .accessibilityIdentifier("rss-read-all")
                    }
                }
                ToolbarItemGroup(placement: .topBarTrailing) {
                    Button { Task { await rss.synchronize(manual: true) } } label: {
                        BusyLabel(isBusy: rss.isLoading) { Label(String(localized: "更新"), systemImage: "arrow.clockwise") }
                    }
                    .labelStyle(.iconOnly)
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
            .refreshable { await rss.refresh(list) }
            .task(id: rss.scope) { await rss.synchronize() }
            .task(id: presentationKey) { await rebuild(presentationKey) }
            .onChange(of: rss.identityID) { _, _ in
                readAll = nil
                initialized = false
                acceptedIDs = []
                presentation = RssPresentation()
                page = 0
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
        page = min(page, pageCount - 1)
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
        HStack(alignment: .top, spacing: 12) {
            Button(action: onOpen) {
                HStack(alignment: .top, spacing: 12) {
                    if let value = entry.imageURL, let url = URL(string: value), url.scheme == "https" {
                        RssThumbnailView(url: url)
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
                BusyLabel(isBusy: saving) {
                    Label(
                        entry.savedID == nil ? String(localized: "あとで読むに保存") : String(localized: "保存を解除"),
                        systemImage: entry.savedID == nil ? "star" : "star.fill"
                    )
                    .labelStyle(.iconOnly)
                }
                .frame(minWidth: 44, minHeight: 44)
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
            Text(String(localized: "記事情報を同期中"))
                .font(.caption).foregroundStyle(AppColors.mutedForeground)
                .frame(minHeight: 20, alignment: .leading)
                .opacity(rss.isLoading && !rss.isMutating && !rss.pendingKeys.contains("import") ? 1 : 0)
                .overlay(alignment: .leading) {
                    if rss.isMutating || rss.pendingKeys.contains("import") {
                        ProgressView().controlSize(.small).accessibilityLabel(String(localized: "処理中"))
                    }
                }
                .accessibilityHidden(!rss.isLoading && !rss.isMutating && !rss.pendingKeys.contains("import"))
                .accessibilityIdentifier(rss.isLoading || rss.isMutating || rss.pendingKeys.contains("import") ? "rss-loading" : "rss-status-idle")
            if let error = rss.errorMessage {
                Text(error).font(.caption).foregroundStyle(AppColors.destructive).accessibilityIdentifier("rss-error")
                Button(String(localized: "再試行")) { Task { await rss.synchronize(manual: true) } }
                    .disabled(!rss.isOnline || rss.isLoading)
            }
            Text(rss.snapshot.fetchedAt.map {
                String(localized: "最終同期") + " " + $0.formatted(date: .abbreviated, time: .shortened)
            } ?? " ")
                .font(.caption).foregroundStyle(AppColors.mutedForeground)
                .accessibilityHidden(rss.snapshot.fetchedAt == nil)
        }
        .accessibilityElement(children: .contain)
    }
}
