#if DEBUG
import SwiftData
import SwiftUI

/// Runs the production list, full-screen presentation, loader and deletion flow without a server.
struct ImageGalleryFixtureView: View {
    @EnvironmentObject private var sync: SyncCoordinator
    @EnvironmentObject private var authentication: AuthenticationModel
    @State private var seeded = false
    @State private var failedLoad = false
    @State private var failedDelete = false

    var body: some View {
        DomainListView(domain: .images, galleryLoadMedia: { _ in
            if ProcessInfo.processInfo.arguments.contains("-gallery-fail-load"), !failedLoad {
                failedLoad = true
                throw URLError(.notConnectedToInternet)
            }
            return Self.imageData
        }, galleryDeleteRecord: { _ in
            try await Task.sleep(for: .milliseconds(300))
            if ProcessInfo.processInfo.arguments.contains("-gallery-fail-delete"), !failedDelete {
                failedDelete = true
                throw URLError(.notConnectedToInternet)
            }
        })
        .task {
            guard !seeded else { return }
            seeded = true
            let count = ProcessInfo.processInfo.arguments.contains("-gallery-single") ? 1 : 35
            let records = (0..<count).map { index in Self.record(index, status: .exported) }
                + [Self.record(99, status: .unexported)]
            for record in records {
                await ThumbnailStore.shared.save(Self.imageData, owner: authentication.ownerKey, domain: .images, id: record.id)
            }
            try? sync.cache(domain: .images, records: records)
        }
    }

    static var imageData: Data {
        UIGraphicsImageRenderer(size: CGSize(width: 300, height: 600)).jpegData(withCompressionQuality: 0.8) { context in
            UIColor.systemIndigo.setFill()
            context.fill(CGRect(x: 0, y: 0, width: 300, height: 600))
        }
    }

    static func record(_ index: Int, status: MobileContentStatus) -> MobileRecord {
        MobileRecord(id: String(format: "gallery-%02d", index), status: status,
                     createdAt: Date(timeIntervalSince1970: Double(1000 - index)), updatedAt: .now,
                     exportedAt: nil, title: "Gallery \(index)", url: nil, quote: nil, categoryId: nil,
                     categoryName: nil, markdown: nil, isbn: nil, rating: nil, tags: nil,
                     path: nil, imagePath: nil, contentType: nil, fileSize: nil)
    }
}

#Preview("Gallery — Image grid") {
    ImageGalleryFixtureView()
        .environmentObject(AuthenticationModel())
        .environmentObject(SyncCoordinator(
            container: try! ModelContainer(for: CachedMobileRecord.self, CachedMobileCategory.self, PendingMobileOperation.self, MobileSyncState.self,
                                           configurations: ModelConfiguration(isStoredInMemoryOnly: true)),
            authentication: AuthenticationModel()
        ))
}
#endif
