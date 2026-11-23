import SwiftUI

struct DiagnosticsView: View {
    @Environment(RssReaderModel.self) private var rss
    @EnvironmentObject private var sync: SyncCoordinator

    var body: some View {
        List {
            AppScreenHeading(String(localized: "診断情報")).appHeadingRow()
            Section(String(localized: "同期")) {
                LabeledContent(String(localized: "コンテンツ最終同期"), value: formatted(sync.lastSyncAt))
                LabeledContent(String(localized: "RSS最終同期"), value: formatted(rss.snapshot.fetchedAt))
            }
            Section(String(localized: "接続先")) {
                Text(Bundle.main.object(forInfoDictionaryKey: "MobileAPIBaseURL") as? String ?? "")
                    .font(.footnote).textSelection(.enabled)
            }
            ForEach(rss.snapshot.feeds) { feed in
                Section(feed.label) {
                    Text(feed.url).font(.footnote).textSelection(.enabled)
                    LabeledContent(String(localized: "最終取得"), value: formatted(feed.lastFetchedAt))
                    if let error = feed.error {
                        Text(error).font(.footnote).foregroundStyle(AppColors.destructive).textSelection(.enabled)
                    }
                }
            }
        }
        .appScreenSurface()
        .navigationTitle("")
        .minimizeNavigationWhenScrolling()
        .navigationBarTitleDisplayMode(.inline)
        .accessibilityIdentifier("diagnostics-view")
    }

    private func formatted(_ date: Date?) -> String {
        date?.formatted(date: .abbreviated, time: .shortened) ?? String(localized: "未取得")
    }
}
