#if DEBUG
import SwiftUI

/// Exercises the production delete toolbar with a response held until the test releases it.
struct ActionLoadingFixtureView: View {
    @State private var path = ["detail"]
    @State private var request = MediaFixtureRequest()
    @State private var fail = false
    @State private var calls = 0
    private var domain: MobileDomain {
        ProcessInfo.processInfo.arguments.contains("-action-image") ? .images : .articles
    }

    var body: some View {
        NavigationStack(path: $path) {
            Text("Deleted").accessibilityIdentifier("fixture-deleted")
                .navigationDestination(for: String.self) { _ in
                    RecordDetailView(domain: domain, id: "exported-\(domain.rawValue)", deleteRecord: {
                        calls += 1
                        try await request.waitForCompletion()
                        if fail { throw URLError(.notConnectedToInternet) }
                    })
                }
        }
        .safeAreaInset(edge: .bottom) {
            HStack {
                Button("Fail request") { fail = true; request.complete() }
                    .disabled(!request.isPending).accessibilityIdentifier("fixture-fail")
                Button("Complete request") { fail = false; request.complete() }
                    .disabled(!request.isPending).accessibilityIdentifier("fixture-complete")
                Text(String(calls)).accessibilityIdentifier("fixture-calls")
            }
            .font(.caption)
        }
    }
}
#endif
