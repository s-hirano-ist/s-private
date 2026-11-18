import SwiftUI
import UniformTypeIdentifiers

struct RssSubscriptionsView: View {
    @Environment(RssReaderModel.self) private var rss
    @State private var sheet: RssSheet?
    @State private var importing = false
    @State private var removing: RssFeed?
    @State private var fileError: String?

    var body: some View {
        List {
            Section {
                RssStatusView()
                Button(String(localized: "購読を追加"), systemImage: "plus") { sheet = .subscribe }
                    .disabled(!rss.canMutate).accessibilityIdentifier("rss-add-subscription")
                Button(String(localized: "Inoreaderから取り込み"), systemImage: "square.and.arrow.down") { importing = true }
                    .disabled(!rss.canMutate).accessibilityIdentifier("rss-import")
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
                        Button(String(localized: "購読解除"), role: .destructive) { removing = feed }
                            .disabled(!rss.canMutate).accessibilityIdentifier("rss-unsubscribe-\(feed.id)")
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
            Button(String(localized: "更新"), systemImage: "arrow.clockwise") {
                Task { await rss.synchronize(manual: true) }
            }
            .disabled(!rss.isOnline || rss.isLoading || rss.isMutating)
        }
        .task { await rss.synchronize() }
        .sheet(item: $sheet) { _ in RssSubscribeView() }
        .fileImporter(
            isPresented: $importing,
            allowedContentTypes: [.zip, .xml, .json, UTType(filenameExtension: "opml") ?? .data]
        ) { result in
            switch result {
            case .success(let url):
                fileError = nil
                Task { await rss.importFile(url) }
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
                if let feed = removing { Task { await rss.unsubscribe(feed) } }
                removing = nil
            }
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
            .scrollContentBackground(.hidden)
            .background(AppColors.background)
            .foregroundStyle(AppColors.foreground)
            .navigationTitle(String(localized: "購読を追加"))
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(String(localized: "キャンセル")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(String(localized: "追加")) {
                        Task {
                            if await rss.subscribe(url: url, title: title, folder: folder) { dismiss() }
                        }
                    }
                    .disabled(!valid || !rss.canMutate).accessibilityIdentifier("rss-subscribe-submit")
                }
            }
        }
    }
}
