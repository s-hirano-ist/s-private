import SwiftUI
import UIKit

/// Keep the UIKit page hierarchy stable until the interactive transition settles.
struct RecordPager<Page: View>: UIViewControllerRepresentable {
    let pages: [RecordPageID]
    @Binding var selection: RecordPageID
    let pagingEnabled: Bool
    var contentRevision: AnyHashable = 0
    @ViewBuilder var page: (RecordPageID) -> Page

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    func makeUIViewController(context: Context) -> UIPageViewController {
        let controller = UIPageViewController(transitionStyle: .scroll, navigationOrientation: .horizontal)
        controller.dataSource = context.coordinator
        controller.delegate = context.coordinator
        return controller
    }

    func updateUIViewController(_ controller: UIPageViewController, context: Context) {
        context.coordinator.parent = self
        context.coordinator.update(controller)
    }

    final class PageController: UIHostingController<Page> {
        let id: RecordPageID

        init(id: RecordPageID, page: Page) {
            self.id = id
            super.init(rootView: page)
        }

        @MainActor required dynamic init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }
    }

    final class Coordinator: NSObject, UIPageViewControllerDataSource, UIPageViewControllerDelegate {
        var parent: RecordPager
        private(set) var appliedPages: [RecordPageID] = []
        private(set) var controllers: [RecordPageID: PageController] = [:]
        private(set) var transitioning = false
        private var selectionAtStart: RecordPageID?
        private var appliedContentRevision: AnyHashable?

        init(_ parent: RecordPager) { self.parent = parent }

        func update(_ controller: UIPageViewController) {
            guard !transitioning else { return }
            controller.view.subviews.compactMap { $0 as? UIScrollView }.forEach {
                $0.isScrollEnabled = parent.pagingEnabled
            }
            let changedPages = appliedPages != parent.pages
            appliedPages = parent.pages
            guard appliedPages.contains(parent.selection) else { return }

            let visible = controller.viewControllers?.first as? PageController
            let selected = makePage(parent.selection)
            if changedPages {
                // Clear UIKit's cached neighbours after additions/removals, only at rest.
                controller.dataSource = nil
                controller.dataSource = self
            }
            if visible?.id != parent.selection || changedPages {
                controller.setViewControllers([selected], direction: .forward, animated: false)
            }
            retainNeighbours(of: parent.selection)
            let contentChanged = appliedContentRevision != parent.contentRevision
            appliedContentRevision = parent.contentRevision
            for (id, hosting) in controllers {
                if contentChanged { hosting.rootView = parent.page(id) }
                hosting.view.accessibilityElementsHidden = id != parent.selection
            }
        }

        private func makePage(_ id: RecordPageID) -> PageController {
            if let cached = controllers[id] { return cached }
            let hosting = PageController(id: id, page: parent.page(id))
            hosting.view.accessibilityElementsHidden = id != parent.selection
            controllers[id] = hosting
            return hosting
        }

        private func retainNeighbours(of id: RecordPageID) {
            guard let index = appliedPages.firstIndex(of: id) else { return }
            let nearby = Set(appliedPages[max(0, index - 1)...min(appliedPages.count - 1, index + 1)])
            controllers = controllers.filter { nearby.contains($0.key) }
            for id in nearby { _ = makePage(id) }
        }

        func pageViewController(_ pageViewController: UIPageViewController, viewControllerBefore viewController: UIViewController) -> UIViewController? {
            adjacent(viewController, offset: -1)
        }

        func pageViewController(_ pageViewController: UIPageViewController, viewControllerAfter viewController: UIViewController) -> UIViewController? {
            adjacent(viewController, offset: 1)
        }

        private func adjacent(_ controller: UIViewController, offset: Int) -> UIViewController? {
            guard let controller = controller as? PageController,
                  let index = appliedPages.firstIndex(of: controller.id),
                  appliedPages.indices.contains(index + offset) else { return nil }
            return makePage(appliedPages[index + offset])
        }

        func pageViewController(_ pageViewController: UIPageViewController, willTransitionTo pendingViewControllers: [UIViewController]) {
            transitioning = true
            selectionAtStart = parent.selection
        }

        func pageViewController(_ pageViewController: UIPageViewController, didFinishAnimating finished: Bool,
                                previousViewControllers: [UIViewController], transitionCompleted completed: Bool) {
            transitioning = false
            // External selection changes (e.g. sync deletion) take precedence.
            if completed, parent.selection == selectionAtStart,
               let visible = pageViewController.viewControllers?.first as? PageController,
               parent.pages.contains(visible.id) {
                parent.selection = visible.id
            }
            selectionAtStart = nil
            update(pageViewController)
        }
    }
}
