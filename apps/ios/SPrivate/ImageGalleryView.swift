import SwiftUI
import UIKit

/// Metadata only: original images are loaded by the current and adjacent pages.
struct ImageGallerySelection: Identifiable {
    let id = UUID()
    private(set) var ids: [String]
    var selectedID: String
    var statusFilter: MobileContentStatus? = nil

    var position: Int { ids.firstIndex(of: selectedID) ?? 0 }

    mutating func retain(_ available: Set<String>) {
        let oldIDs = ids
        let oldPosition = position
        ids.removeAll { !available.contains($0) }
        if !ids.contains(selectedID), !ids.isEmpty {
            selectedID = oldIDs.dropFirst(oldPosition).first(where: available.contains) ?? ids.last!
        }
    }
}

struct ImageGalleryView: View {
    @State var selection: ImageGallerySelection
    var loadMedia: (@MainActor (String) async throws -> Data)?
    var deleteRecord: (@MainActor (String) async throws -> Void)?
    @EnvironmentObject private var authentication: AuthenticationModel
    @EnvironmentObject private var sync: SyncCoordinator
    @Environment(\.dismiss) private var dismiss
    @State private var showingDelete = false
    @State private var deleting = false
    @State private var zoomed = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            GalleryPager(ids: selection.ids, selectedID: $selection.selectedID,
                         pagingEnabled: !zoomed && !deleting && !showingDelete) { id in
                GalleryImagePage(id: id, loadMedia: loadMedia) { isZoomed in
                    guard id == selection.selectedID else { return }
                    zoomed = isZoomed
                }
                .environmentObject(authentication)
                .environmentObject(sync)
            }
            .background(AppColors.background)
            .accessibilityIdentifier("image-gallery")
            .navigationTitle(String(format: String(localized: "%lld / %lld"), selection.position + 1, selection.ids.count))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(String(localized: "閉じる")) { dismiss() }
                        .disabled(deleting)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(role: .destructive) { showingDelete = true } label: {
                        BusyLabel(isBusy: deleting, status: String(localized: "削除中")) {
                            Label(String(localized: "削除"), systemImage: "trash")
                        }
                    }
                    .disabled(deleting || selection.ids.isEmpty)
                    .accessibilityIdentifier("gallery-delete")
                }
            }
            .safeAreaInset(edge: .bottom) {
                if let errorMessage {
                    Text(errorMessage).foregroundStyle(AppColors.destructive).padding()
                        .accessibilityIdentifier("gallery-error")
                }
            }
            .confirmationDialog(String(localized: "この項目を削除しますか？"), isPresented: $showingDelete, titleVisibility: .visible) {
                Button(String(localized: "削除"), role: .destructive) {
                    let id = selection.selectedID
                    Task { await delete(id) }
                }
            }
        }
        .onAppear { reconcile() }
        .onChange(of: selection.selectedID) { _, _ in zoomed = false; errorMessage = nil }
        .onChange(of: sync.dataRevision) { _, _ in reconcile() }
        .onChange(of: authentication.ownerKey) { _, _ in dismiss() }
        .onChange(of: authentication.status) { _, status in
            if status != .authenticated { dismiss() }
        }
    }

    private func reconcile() {
        let available = Set(sync.cached(domain: .images)
            .filter { selection.statusFilter == nil || $0.status == selection.statusFilter }
            .map(\.id))
        selection.retain(available)
        if selection.ids.isEmpty { dismiss() }
    }

    private func delete(_ id: String) async {
        guard !deleting else { return }
        deleting = true
        errorMessage = nil
        defer { deleting = false }
        let owner = authentication.ownerKey
        do {
            if let deleteRecord { try await deleteRecord(id) }
            else { try await MobileClient(authentication: authentication).delete(.images, id: id) }
            guard owner == authentication.ownerKey, authentication.status == .authenticated else { return }
            sync.removeCached(domain: .images, id: id)
            reconcile()
        } catch {
            errorMessage = MobileOperationError.message(error, taskIsCancelled: Task.isCancelled)
        }
    }
}

private struct GalleryImagePage: View {
    let id: String
    var loadMedia: (@MainActor (String) async throws -> Data)?
    var onZoomChange: (Bool) -> Void
    @EnvironmentObject private var authentication: AuthenticationModel
    @EnvironmentObject private var sync: SyncCoordinator
    @State private var image: UIImage?
    @State private var errorMessage: String?
    @State private var retry = 0

    var body: some View {
        Group {
            if let image {
                ZoomableImageView(image: image, onZoomChange: onZoomChange)
            } else if let errorMessage {
                VStack(spacing: 12) {
                    Text(errorMessage).foregroundStyle(AppColors.destructive)
                    Button(String(localized: "再試行")) { retry += 1 }
                }
            } else {
                ProgressView().accessibilityIdentifier("gallery-loading")
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(AppColors.background)
        .task(id: retry) {
            errorMessage = nil
            let owner = authentication.ownerKey
            if loadMedia == nil, let data = sync.cachedMedia(domain: .images, id: id, variant: "original"),
               let cached = UIImage(data: data) {
                image = cached
                return
            }
            do {
                let data: Data
                if let loadMedia { data = try await loadMedia(id) }
                else { data = try await MobileClient(authentication: authentication).media(.images, id: id, variant: "original") }
                try Task.checkCancellation()
                guard owner == authentication.ownerKey, authentication.status == .authenticated,
                      sync.cachedRecord(domain: .images, id: id) != nil else { return }
                guard let decoded = UIImage(data: data) else { throw MobileClientError.invalidResponse }
                if loadMedia == nil { try? sync.cacheMedia(data, domain: .images, id: id, variant: "original") }
                image = decoded
            } catch {
                guard !Task.isCancelled else { return }
                errorMessage = MobileOperationError.message(error, taskIsCancelled: false)
            }
        }
    }
}

/// UIKit requests pages on demand; do not retain a controller or decoded image for every ID.
private struct GalleryPager<Page: View>: UIViewControllerRepresentable {
    let ids: [String]
    @Binding var selectedID: String
    let pagingEnabled: Bool
    @ViewBuilder var page: (String) -> Page

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    func makeUIViewController(context: Context) -> UIPageViewController {
        let controller = UIPageViewController(transitionStyle: .scroll, navigationOrientation: .horizontal)
        controller.dataSource = context.coordinator
        controller.delegate = context.coordinator
        return controller
    }

    func updateUIViewController(_ controller: UIPageViewController, context: Context) {
        let coordinator = context.coordinator
        let changedIDs = coordinator.parent.ids != ids
        coordinator.parent = self
        controller.view.subviews.compactMap { $0 as? UIScrollView }.forEach { $0.isScrollEnabled = pagingEnabled }
        guard !coordinator.transitioning else { return }
        if coordinator.currentID != selectedID || changedIDs || controller.viewControllers?.isEmpty != false {
            coordinator.currentID = selectedID
            if ids.contains(selectedID) {
                let visible = controller.viewControllers?.first as? PageController
                let selected = visible?.id == selectedID ? visible! : coordinator.makePage(selectedID)
                controller.setViewControllers([selected], direction: .forward, animated: false)
            }
        }
    }

    final class PageController: UIHostingController<Page> {
        let id: String
        init(id: String, page: Page) { self.id = id; super.init(rootView: page) }
        @MainActor required dynamic init?(coder aDecoder: NSCoder) { fatalError("init(coder:) has not been implemented") }
    }

    final class Coordinator: NSObject, UIPageViewControllerDataSource, UIPageViewControllerDelegate {
        var parent: GalleryPager
        var currentID: String?
        var transitioning = false
        init(_ parent: GalleryPager) { self.parent = parent }

        func makePage(_ id: String) -> PageController { PageController(id: id, page: parent.page(id)) }

        func pageViewController(_ pageViewController: UIPageViewController, viewControllerBefore viewController: UIViewController) -> UIViewController? {
            adjacent(viewController, offset: -1)
        }

        func pageViewController(_ pageViewController: UIPageViewController, viewControllerAfter viewController: UIViewController) -> UIViewController? {
            adjacent(viewController, offset: 1)
        }

        private func adjacent(_ controller: UIViewController, offset: Int) -> UIViewController? {
            guard let controller = controller as? PageController,
                  let index = parent.ids.firstIndex(of: controller.id), parent.ids.indices.contains(index + offset) else { return nil }
            return makePage(parent.ids[index + offset])
        }

        func pageViewController(_ pageViewController: UIPageViewController, willTransitionTo pendingViewControllers: [UIViewController]) {
            transitioning = true
        }

        func pageViewController(_ pageViewController: UIPageViewController, didFinishAnimating finished: Bool, previousViewControllers: [UIViewController], transitionCompleted completed: Bool) {
            transitioning = false
            guard let visible = pageViewController.viewControllers?.first as? PageController else { return }
            // A synchronization may have removed the pending page during the gesture.
            if parent.ids.contains(visible.id) {
                currentID = visible.id
                parent.selectedID = visible.id
            } else if parent.ids.contains(parent.selectedID) {
                currentID = parent.selectedID
                pageViewController.setViewControllers([makePage(parent.selectedID)], direction: .forward, animated: false)
            }
        }
    }
}

#if DEBUG
#Preview("Gallery — Paged images") {
    @Previewable @State var selectedID = "1"
    GalleryPager(ids: ["1", "2", "3"], selectedID: $selectedID, pagingEnabled: true) { _ in
        ZoomableImageView(image: UIImage(data: ImageGalleryFixtureView.imageData)!)
    }
}
#endif
