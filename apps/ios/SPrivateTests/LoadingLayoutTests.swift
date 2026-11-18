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
    private func measure(_ view: some View) -> CGSize {
        UIHostingController(rootView: view).sizeThatFits(in: CGSize(width: 360, height: 2000))
    }
}
