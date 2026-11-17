#if DEBUG
import SwiftUI

/// Drives the real detail media component without external requests or persistent cache hits.
struct MediaLoadingFixtureView: View {
    @State private var id = UUID().uuidString
    @State private var attempts = 0
    @State private var presentation = 0
    private var landscape: Bool { ProcessInfo.processInfo.arguments.contains("-media-landscape") }
    private var failsFirst: Bool { ProcessInfo.processInfo.arguments.contains("-media-fails-first") }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("The Design of Everyday Things").font(.title2.bold())
                    AuthenticatedImageView(domain: landscape ? .images : .books, id: id) {
                        attempts += 1
                        let attempt = attempts
                        try await Task.sleep(for: .seconds(3))
                        if failsFirst && attempt == 1 { throw URLError(.notConnectedToInternet) }
                        let size = landscape ? CGSize(width: 900, height: 300) : CGSize(width: 300, height: 600)
                        return UIGraphicsImageRenderer(size: size).jpegData(withCompressionQuality: 0.8) { context in
                            UIColor.systemIndigo.setFill()
                            context.fill(CGRect(origin: .zero, size: size))
                        }
                    }
                    .id(presentation)
                    LabeledContent("ISBN", value: "9780465050659")
                        .accessibilityIdentifier("fixture-isbn")
                    Button("Reload cached image") { presentation += 1 }
                        .accessibilityIdentifier("fixture-reopen")
                }
                .padding()
            }
            .background(AppColors.background)
            .foregroundStyle(AppColors.foreground)
        }
    }
}
#endif
