import SwiftUI
import UIKit

struct ImagePreviewView: View {
    let image: UIImage
    @Environment(\.dismiss) private var dismiss
    @State private var controlsHidden = false

    var body: some View {
        MediaViewer(controlsHidden: $controlsHidden, close: { dismiss() }) { toggleControls in
            ZoomableImageView(image: image, onMediaTap: toggleControls)
        } trailing: {
            EmptyView()
        }
    }
}

struct MediaViewer<Media: View, Trailing: View>: View {
    @Binding var controlsHidden: Bool
    var position: String?
    var closeDisabled = false
    var close: () -> Void
    @ViewBuilder var media: (@escaping () -> Void) -> Media
    @ViewBuilder var trailing: () -> Trailing
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.accessibilityVoiceOverEnabled) private var voiceOverEnabled

    var body: some View {
        ZStack(alignment: .top) {
            media(toggleControls)
                .ignoresSafeArea(.container, edges: .vertical)
            if !controlsHidden || voiceOverEnabled {
                GlassEffectContainer(spacing: 12) {
                    ZStack {
                        if let position {
                            Text(position)
                                .font(.subheadline.monospacedDigit())
                                .lineLimit(1)
                                .minimumScaleFactor(0.65)
                                .padding(.horizontal, 12)
                                .frame(minHeight: AppLayout.minimumTarget)
                                .glassEffect(.regular)
                                .padding(.horizontal, 60)
                                .allowsHitTesting(false)
                                .accessibilityAddTraits(.isHeader)
                                .accessibilityIdentifier("gallery-position")
                        }
                        HStack {
                            Button(action: close) {
                                Label(String(localized: "閉じる"), systemImage: "xmark")
                                    .labelStyle(.iconOnly)
                                    .mediaControlSurface()
                            }
                            .buttonStyle(.plain)
                            .disabled(closeDisabled)
                            .accessibilityIdentifier("media-viewer-close")
                            Spacer()
                            trailing()
                        }
                    }
                }
                .padding(.horizontal, AppLayout.inset)
                .padding(.top, AppLayout.small)
                .transition(.opacity)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(AppColors.background.ignoresSafeArea())
        .accessibilityAction(.escape) {
            if !closeDisabled { close() }
        }
    }

    private func toggleControls() {
        guard !voiceOverEnabled, !closeDisabled else { return }
        withAnimation(reduceMotion ? nil : .easeInOut(duration: 0.2)) {
            controlsHidden.toggle()
        }
    }
}

extension View {
    func mediaControlSurface() -> some View {
        font(.system(size: 20, weight: .medium))
            .frame(width: AppLayout.minimumTarget, height: AppLayout.minimumTarget)
            .contentShape(Circle())
            .glassEffect(.regular.interactive(), in: .circle)
    }
}

struct ZoomableImageView: UIViewRepresentable {
    let image: UIImage
    var onZoomChange: ((Bool) -> Void)?
    var onMediaTap: (() -> Void)?

    func makeUIView(context: Context) -> ImagePreviewScrollView {
        ImagePreviewScrollView()
    }

    func updateUIView(_ uiView: ImagePreviewScrollView, context: Context) {
        uiView.onZoomChange = onZoomChange
        uiView.onMediaTap = onMediaTap
        uiView.display(image)
    }
}

/// The image's unzoomed frame is the viewport width, independent of source pixels.
final class ImagePreviewScrollView: UIScrollView, UIScrollViewDelegate {
    let imageView = UIImageView()
    private var viewportSize: CGSize = .zero
    var onZoomChange: ((Bool) -> Void)?
    var onMediaTap: (() -> Void)? {
        didSet { mediaTap.isEnabled = onMediaTap != nil }
    }
    private lazy var mediaTap = UITapGestureRecognizer(target: self, action: #selector(didTapMedia))

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
        mediaTap.cancelsTouchesInView = false
        mediaTap.isEnabled = false
        addGestureRecognizer(mediaTap)
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    @objc private func didTapMedia() { onMediaTap?() }

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
