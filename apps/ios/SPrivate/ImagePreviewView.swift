import SwiftUI
import UIKit

struct ImagePreviewView: View {
    let image: UIImage
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZoomableImageView(image: image)
                .background(AppColors.background)
                .toolbar {
                    Button(String(localized: "閉じる")) { dismiss() }
                }
        }
    }
}

struct ZoomableImageView: UIViewRepresentable {
    let image: UIImage
    var onZoomChange: ((Bool) -> Void)?

    func makeUIView(context: Context) -> ImagePreviewScrollView {
        ImagePreviewScrollView()
    }

    func updateUIView(_ uiView: ImagePreviewScrollView, context: Context) {
        uiView.onZoomChange = onZoomChange
        uiView.display(image)
    }
}

/// The image's unzoomed frame is the viewport width, independent of source pixels.
final class ImagePreviewScrollView: UIScrollView, UIScrollViewDelegate {
    let imageView = UIImageView()
    private var viewportSize: CGSize = .zero
    var onZoomChange: ((Bool) -> Void)?

    init() {
        super.init(frame: .zero)
        delegate = self
        minimumZoomScale = 1
        maximumZoomScale = 4
        contentInsetAdjustmentBehavior = .never
        accessibilityIdentifier = "media-preview-scroll"
        imageView.contentMode = .scaleAspectFit
        imageView.isAccessibilityElement = true
        imageView.accessibilityLabel = String(localized: "画像")
        imageView.accessibilityIdentifier = "media-preview-image"
        addSubview(imageView)
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    func display(_ image: UIImage) {
        guard imageView.image !== image else { return }
        imageView.image = image
        viewportSize = .zero
        setNeedsLayout()
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        guard bounds.width > 0, bounds.height > 0,
              let image = imageView.image, image.size.width > 0, image.size.height > 0,
              viewportSize != bounds.size else { return }
        viewportSize = bounds.size
        setZoomScale(1, animated: false)
        imageView.frame = CGRect(
            origin: .zero,
            size: CGSize(width: bounds.width, height: bounds.width * image.size.height / image.size.width)
        )
        contentSize = imageView.frame.size
        centerImage()
        contentOffset = CGPoint(x: -contentInset.left, y: -contentInset.top)
    }

    func viewForZooming(in scrollView: UIScrollView) -> UIView? { imageView }

    func scrollViewDidZoom(_ scrollView: UIScrollView) {
        centerImage()
        onZoomChange?(zoomScale > minimumZoomScale + 0.01)
    }

    private func centerImage() {
        let horizontal = max(0, (bounds.width - imageView.frame.width) / 2)
        let vertical = max(0, (bounds.height - imageView.frame.height) / 2)
        contentInset = UIEdgeInsets(top: vertical, left: horizontal, bottom: vertical, right: horizontal)
        imageView.accessibilityValue = "\(Int((zoomScale * 100).rounded()))%"
    }
}

#if DEBUG
#Preview("Image preview — Landscape") {
    ImagePreviewView(image: previewImage(size: CGSize(width: 900, height: 300)))
}

#Preview("Image preview — Portrait") {
    ImagePreviewView(image: previewImage(size: CGSize(width: 300, height: 600)))
}

#Preview("Image preview — Square") {
    ImagePreviewView(image: previewImage(size: CGSize(width: 600, height: 600)))
}

@MainActor
private func previewImage(size: CGSize) -> UIImage {
    UIGraphicsImageRenderer(size: size).image { context in
        UIColor.systemIndigo.setFill()
        context.fill(CGRect(origin: .zero, size: size))
    }
}
#endif
