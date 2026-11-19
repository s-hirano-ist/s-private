import Testing
import UIKit
@testable import SPrivate

@MainActor
struct ImagePreviewTests {
    @Test(arguments: [CGSize(width: 900, height: 300), CGSize(width: 300, height: 600), CGSize(width: 600, height: 600)])
    func fitsViewportWidth(_ size: CGSize) {
        let view = makeView(size)
        #expect(view.imageView.frame.width == 390)
        #expect(abs(view.imageView.frame.height - 390 * size.height / size.width) < 0.01)
        #expect(view.zoomScale == 1)
        #expect(view.contentOffset.y == -view.contentInset.top)
        #expect(view.contentInset.top == max(0, (700 - view.imageView.frame.height) / 2))
    }

    @Test func preservesZoomUntilViewportChanges() {
        let view = makeView(CGSize(width: 300, height: 600))
        view.setZoomScale(2, animated: false)
        view.contentOffset = CGPoint(x: 50, y: 150)
        view.display(view.imageView.image!)
        view.setNeedsLayout()
        view.layoutIfNeeded()
        #expect(view.zoomScale == 2)
        #expect(view.contentOffset == CGPoint(x: 50, y: 150))
        #expect(view.contentSize.width == 780)
        view.frame.size = CGSize(width: 700, height: 390)
        view.layoutIfNeeded()
        #expect(view.zoomScale == 1)
        #expect(view.imageView.frame.size == CGSize(width: 700, height: 1400))
        #expect(view.contentOffset == .zero)
    }

    @Test func clampsZoomAndResetsForAnotherImage() {
        let view = makeView(CGSize(width: 900, height: 300))
        view.setZoomScale(10, animated: false)
        #expect(view.zoomScale == 4)
        view.setZoomScale(0.5, animated: false)
        #expect(view.zoomScale == 1)
        view.setZoomScale(2, animated: false)
        view.display(image(CGSize(width: 600, height: 600)))
        view.layoutIfNeeded()
        #expect(view.zoomScale == 1)
        #expect(view.imageView.frame.size == CGSize(width: 390, height: 390))
    }

    private func makeView(_ size: CGSize) -> ImagePreviewScrollView {
        let view = ImagePreviewScrollView()
        view.frame = CGRect(x: 0, y: 0, width: 390, height: 700)
        view.display(image(size))
        view.layoutIfNeeded()
        return view
    }

    private func image(_ size: CGSize) -> UIImage {
        UIGraphicsImageRenderer(size: size).image { _ in }
    }
}
