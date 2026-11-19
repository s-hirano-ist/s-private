import SwiftUI
import UniformTypeIdentifiers

struct RssSubscriptionsView: View {
    @Environment(RssReaderModel.self) private var rss
    @State private var sheet: RssSheet?
    @State private var importing = false
    @State private var importIdentity: UUID?
    @State private var removing: (feed: RssFeed, identityID: UUID)?
    @State private var fileError: String?

    var body: some View {
        List {
            Section {
                RssStatusView()
                Button(String(localized: "購読を追加"), systemImage: "plus") { sheet = .subscribe }
                    .disabled(!rss.canMutate || rss.pendingKeys.contains(where: { $0.hasPrefix("subscribe:") })).accessibilityIdentifier("rss-add-subscription")
                Button { importIdentity = rss.identityID; importing = true } label: {
                    BusyLabel(isBusy: rss.pendingKeys.contains("import")) {
                        Label(String(localized: "Inoreaderから取り込み"), systemImage: "square.and.arrow.down")
                    }
                }
                    .accessibilityValue(rss.pendingKeys.contains("import") ? String(localized: "処理中") : "")
                    .disabled(!rss.canMutate || rss.pendingKeys.contains("import")).accessibilityIdentifier("rss-import")
                Text(String(localized: "Inoreader ZIP、OPML、starred.jsonに対応します"))
                    .font(.caption).foregroundStyle(AppColors.mutedForeground)
                if let summary = rss.importSummary {
                    Text(summary).font(.caption).accessibilityIdentifier("rss-import-summary")
                }
                if let fileError { Text(fileError).foregroundStyle(AppColors.destructive) }
            }
            .listRowBackground(AppColors.background)
            if rss.snapshot.feeds.isEmpty && rss.isLoading {
                ForEach(0..<6) { _ in
                    LoadingContent { SkeletonText() }
                        .listRowBackground(AppColors.background)
                }
            }
            ForEach(rss.snapshot.feeds) { feed in
                let identity = rss.identityID
                Section {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(feed.label).font(.headline)
                        Text(feed.url).font(.caption).textSelection(.enabled).foregroundStyle(AppColors.mutedForeground)
                        if let date = feed.lastFetchedAt {
                            Text(String(localized: "最終取得") + " " + date.formatted(date: .abbreviated, time: .shortened))
                                .font(.caption)
                        } else {
                            Text(String(localized: "未取得")).font(.caption)
                        }
                        if feed.error != nil {
                            Label(String(localized: "フィードを取得できませんでした"), systemImage: "exclamationmark.triangle").font(
                                .caption
                            ).foregroundStyle(AppColors.destructive)
                        }
                        Button(role: .destructive) { removing = (feed, identity) } label: {
                            BusyLabel(isBusy: rss.pendingKeys.contains("unsubscribe:\(feed.id)")) { Text(String(localized: "購読解除")) }
                        }
                            .accessibilityValue(rss.pendingKeys.contains("unsubscribe:\(feed.id)") ? String(localized: "処理中") : "")
                            .disabled(!rss.canMutate || rss.pendingKeys.contains("unsubscribe:\(feed.id)")).accessibilityIdentifier("rss-unsubscribe-\(feed.id)")
                    }
                    .listRowBackground(AppColors.background)
                }
            }
            if rss.snapshot.feeds.isEmpty && !rss.isLoading {
                ContentUnavailableView(String(localized: "購読はありません"), systemImage: "dot.radiowaves.left.and.right")
                    .listRowBackground(AppColors.background)
            }
        }
        .scrollContentBackground(.hidden)
        .background(AppColors.background)
        .foregroundStyle(AppColors.foreground)
        .navigationTitle(String(localized: "RSSの購読管理"))
        .accessibilityIdentifier("rss-subscriptions")
        .toolbar {
            Button { Task { await rss.synchronize(manual: true) } } label: {
                BusyLabel(isBusy: rss.isLoading) { Label(String(localized: "更新"), systemImage: "arrow.clockwise") }
            }
            .labelStyle(.iconOnly)
            .accessibilityLabel(rss.isLoading ? String(localized: "更新") + ", " + String(localized: "処理中") : String(localized: "更新"))
            .disabled(!rss.isOnline || rss.isLoading)
        }
        .task { await rss.synchronize() }
        .onChange(of: rss.identityID) { _, _ in removing = nil; sheet = nil; importing = false; importIdentity = nil; fileError = nil }
        .sheet(item: $sheet) { _ in RssSubscribeView() }
        .fileImporter(
            isPresented: $importing,
            allowedContentTypes: [.zip, .xml, .json, UTType(filenameExtension: "opml") ?? .data]
        ) { result in
            guard importIdentity == rss.identityID else { return }
            switch result {
            case .success(let url):
                guard rss.canMutate else { fileError = RssError.offline.localizedDescription; return }
                fileError = nil
                let sessionID = rss.sessionID
                Task { await rss.importFile(url, sessionID: sessionID) }
            case .failure(let error):
                if (error as NSError).code != NSUserCancelledError { fileError = MobileOperationError.message(error) }
            }
        }
        .confirmationDialog(
            String(localized: "購読を解除しますか？保存済みの記事は残ります"),
            isPresented: Binding(get: { removing != nil }, set: { if !$0 { removing = nil } }),
            titleVisibility: .visible
        ) {
            Button(String(localized: "購読解除"), role: .destructive) {
                if let captured = removing, captured.identityID == rss.identityID {
                    let sessionID = rss.sessionID
                    Task { await rss.unsubscribe(captured.feed, sessionID: sessionID) }
                }
                removing = nil
            }
            .disabled(!rss.canMutate)
            Button(String(localized: "キャンセル"), role: .cancel) { removing = nil }
        }
    }
}

private enum RssSheet: String, Identifiable {
    case subscribe
    var id: String { rawValue }
}

private struct RssSubscribeView: View {
    @Environment(RssReaderModel.self) private var rss
    @Environment(\.dismiss) private var dismiss
    @State private var url = ""
    @State private var title = ""
    @State private var folder = ""
    @State private var identity: UUID?
    @State private var submitting = false

    private var valid: Bool {
        guard let parsed = URL(string: url), ["http", "https"].contains(parsed.scheme?.lowercased() ?? ""),
            parsed.host != nil,
            parsed.user == nil, parsed.password == nil
        else { return false }
        return !url.isEmpty && url.utf16.count <= 2048 && title.utf16.count <= 512 && folder.utf16.count <= 512
    }
    var body: some View {
        NavigationStack {
            Form {
                TextField(String(localized: "フィードURL"), text: $url)
                    .keyboardType(.URL).textInputAutocapitalization(.never).autocorrectionDisabled()
                    .accessibilityIdentifier("rss-subscribe-url")
                TextField(String(localized: "タイトル（任意）"), text: $title).accessibilityIdentifier("rss-subscribe-title")
                TextField(String(localized: "フォルダー（任意）"), text: $folder)
                if let error = rss.errorMessage { Text(error).foregroundStyle(AppColors.destructive) }
            }
            .disabled(submitting)
            .scrollContentBackground(.hidden)
            .background(AppColors.background)
            .foregroundStyle(AppColors.foreground)
            .navigationTitle(String(localized: "購読を追加"))
            .onAppear { identity = rss.identityID }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(String(localized: "キャンセル")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        guard identity == rss.identityID, !submitting else { return }
                        submitting = true
                        let sessionID = rss.sessionID
                        Task {
                            let succeeded = await rss.subscribe(url: url, title: title, folder: folder, sessionID: sessionID)
                            submitting = false
                            if succeeded { dismiss() }
                        }
                    } label: {
                        BusyLabel(isBusy: submitting) { Text(String(localized: "追加")) }
                    }
                    .accessibilityLabel(submitting ? String(localized: "追加") + ", " + String(localized: "処理中") : String(localized: "追加"))
                    .disabled(submitting || !valid || !rss.canMutate || identity != rss.identityID || rss.pendingKeys.contains("subscribe:\(url)")).accessibilityIdentifier("rss-subscribe-submit")
                }
            }
        }
    }
}
