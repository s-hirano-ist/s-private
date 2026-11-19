import SwiftUI
import Testing
@testable import SPrivate

struct LoadingLayoutTests {
    @MainActor
    @Test("Media phases reserve identical space for portrait and landscape content")
    func mediaPhasesKeepGeometry() {
        for ratio: CGFloat in [1, 4.0 / 3.0] {
            for size in [CGSize(width: 300, height: 900), CGSize(width: 900, height: 300)] {
                let image = UIGraphicsImageRenderer(size: size).image { _ in }
                let loading = measure(MediaFrame(aspectRatio: ratio) { LoadingContent { SkeletonBlock() } })
                let loaded = measure(MediaFrame(aspectRatio: ratio) { Image(uiImage: image).resizable().scaledToFit() })
                let failed = measure(MediaFrame(aspectRatio: ratio) {
                    VStack {
                        Text("通信環境を確認して再試行してください")
                        Button("再試行") {}
                    }
                })
                #expect(abs(loading.height - 360 / ratio) < 1)
                #expect(abs(loaded.height - loading.height) < 1)
                #expect(abs(failed.height - loading.height) < 1)
            }
        }
    }

    @MainActor
    @Test("RSS thumbnails decode at display resolution and keep the existing 72 point frame")
    func rssThumbnailDownsampling() async throws {
        let original = UIGraphicsImageRenderer(size: CGSize(width: 3000, height: 2000)).image { context in
            UIColor.red.setFill()
            context.fill(CGRect(x: 0, y: 0, width: 3000, height: 2000))
        }
        let data = try #require(original.jpegData(compressionQuality: 0.8))
        let image = await Task.detached { RssThumbnailLoader.decode(data, pixelSize: 216) }.value
        let decoded = try #require(image?.cgImage)
        #expect(max(decoded.width, decoded.height) <= 216)
        #expect(RssThumbnailLoader.decode(Data("invalid".utf8), pixelSize: 216) == nil)
        let frame = measure(RssThumbnailView(url: URL(string: "https://example.com/image.jpg")!))
        #expect(frame.width == 72 && frame.height == 72)
    }

    @MainActor
    @Test("Action labels preserve their intrinsic size through work, in both languages and large type")
    func busyLabelsKeepGeometry() {
        for locale in ["ja", "en"] {
            for typeSize in [DynamicTypeSize.large, .accessibility3] {
                for iconOnly in [false, true] {
                    let idle = measure(actionLabel(busy: false, iconOnly: iconOnly, locale: locale, typeSize: typeSize))
                    let busy = measure(actionLabel(busy: true, iconOnly: iconOnly, locale: locale, typeSize: typeSize))
                    #expect(abs(idle.width - busy.width) < 1)
                    #expect(abs(idle.height - busy.height) < 1)
                    #expect(idle.width >= 20 && idle.height >= 20)
                }
            }
        }
    }

    private func actionLabel(busy: Bool, iconOnly: Bool, locale: String, typeSize: DynamicTypeSize) -> some View {
        Group {
            if iconOnly {
                BusyLabel(isBusy: busy) { Label("削除", systemImage: "trash") }.labelStyle(.iconOnly)
            } else {
                BusyLabel(isBusy: busy) { Text("今すぐ同期") }
            }
        }
        .environment(\.locale, Locale(identifier: locale))
        .environment(\.dynamicTypeSize, typeSize)
        .fixedSize()
    }

    @MainActor
    private func measure(_ view: some View) -> CGSize {
        UIHostingController(rootView: view).sizeThatFits(in: CGSize(width: 360, height: 2000))
    }
}
