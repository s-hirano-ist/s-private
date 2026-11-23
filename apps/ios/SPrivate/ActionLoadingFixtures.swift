#if DEBUG
import SwiftUI

/// Exercises the production delete toolbar with a response held until the test releases it.
struct ActionLoadingFixtureView: View {
    @EnvironmentObject private var sync: SyncCoordinator
    @State private var path = ["detail"]
    @State private var request = MediaFixtureRequest()
    @State private var fail = false
    @State private var calls = 0
    private var domain: MobileDomain {
        ProcessInfo.processInfo.arguments.contains("-action-image") ? .images : .notes
    }

    var body: some View {
        NavigationStack(path: $path) {
            VStack {
                Text("Deleted").accessibilityIdentifier("fixture-deleted")
                if ProcessInfo.processInfo.arguments.contains("-action-paging") {
                    Text(sync.cachedRecord(domain: domain, id: "exported-\(domain.rawValue)") == nil ? "missing" : "present")
                        .accessibilityIdentifier("fixture-original-record")
                    Text(sync.cachedRecord(domain: domain, id: "unexported-\(domain.rawValue)") == nil ? "missing" : "present")
                        .accessibilityIdentifier("fixture-next-record")
                }
            }
            .navigationDestination(for: String.self) { _ in
                if ProcessInfo.processInfo.arguments.contains("-action-paging") {
                    RecordDetailPagerView(
                        pages: ["exported", "unexported"].map { RecordPageID(domain: domain, id: "\($0)-\(domain.rawValue)") },
                        selection: RecordPageID(domain: domain, id: "exported-\(domain.rawValue)"),
                        deleteRecord: deleteRecord
                    )
                } else {
                    RecordDetailView(domain: domain, id: "exported-\(domain.rawValue)", deleteRecord: deleteRecord)
                }
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

    private func deleteRecord() async throws {
        calls += 1
        try await request.waitForCompletion()
        if fail { throw URLError(.notConnectedToInternet) }
    }
}
#endif
