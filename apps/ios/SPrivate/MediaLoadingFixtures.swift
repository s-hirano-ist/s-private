#if DEBUG
import SwiftUI

/// Drives the real detail media component without external requests or persistent cache hits.
struct MediaLoadingFixtureView: View {
    @State private var id = UUID().uuidString
    @State private var attempts = 0
    @State private var presentation = 0
    @State private var request = MediaFixtureRequest()
    private var landscape: Bool { ProcessInfo.processInfo.arguments.contains("-media-landscape") }
    private var square: Bool { ProcessInfo.processInfo.arguments.contains("-media-square") }
    private var failsFirst: Bool { ProcessInfo.processInfo.arguments.contains("-media-fails-first") }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("The Design of Everyday Things").font(.title2.bold())
                    AuthenticatedImageView(domain: landscape ? .images : .books, id: id) {
                        attempts += 1
                        let attempt = attempts
                        try await request.waitForCompletion()
                        if failsFirst && attempt == 1 { throw URLError(.notConnectedToInternet) }
                        let size = square ? CGSize(width: 600, height: 600) : landscape ? CGSize(width: 900, height: 300) : CGSize(width: 300, height: 600)
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
            .toolbar {
                Button("Complete image request") { request.complete() }
                    .disabled(!request.isPending)
                    .accessibilityIdentifier("fixture-complete")
            }
        }
    }
}

/// Keeps each phase observable until the UI test explicitly releases the response.
@MainActor
@Observable
private final class MediaFixtureRequest {
    private(set) var isPending = false
    @ObservationIgnored private var continuation: CheckedContinuation<Void, Error>?

    func waitForCompletion() async throws {
        try await withTaskCancellationHandler {
            try await withCheckedThrowingContinuation { continuation in
                self.continuation = continuation
                isPending = true
            }
        } onCancel: {
            Task { @MainActor in self.finish(throwing: CancellationError()) }
        }
    }

    func complete() { finish() }

    private func finish(throwing error: Error? = nil) {
        let pending = continuation
        continuation = nil
        isPending = false
        if let error { pending?.resume(throwing: error) } else { pending?.resume() }
    }
}
#endif
