@preconcurrency import CoreSpotlight

final class SpotlightIndexRequestHandler: CSIndexExtensionRequestHandler {
    override func searchableIndex(
        _ searchableIndex: CSSearchableIndex,
        reindexAllSearchableItemsWithAcknowledgementHandler acknowledgementHandler: @escaping () -> Void
    ) {
        reindex(entries: (try? SpotlightSnapshotStore.read()) ?? [], acknowledgementHandler: acknowledgementHandler)
    }

    override func searchableIndex(
        _ searchableIndex: CSSearchableIndex,
        reindexSearchableItemsWithIdentifiers identifiers: [String],
        acknowledgementHandler: @escaping () -> Void
    ) {
        let requested = Set(identifiers)
        let entries = ((try? SpotlightSnapshotStore.read()) ?? []).filter { requested.contains($0.uniqueIdentifier) }
        reindex(entries: entries, acknowledgementHandler: acknowledgementHandler)
    }

    override func searchableItems(
        forIdentifiers identifiers: [String],
        protectionClass: FileProtectionType
    ) async -> [CSSearchableItem] {
        guard protectionClass == .complete else { return [] }
        let requested = Set(identifiers)
        return ((try? SpotlightSnapshotStore.read()) ?? [])
            .filter { requested.contains($0.uniqueIdentifier) }
            .map(\.searchableItem)
    }

    private func reindex(entries: [SpotlightSnapshotEntry], acknowledgementHandler: @escaping () -> Void) {
        let index = CSSearchableIndex(name: SpotlightSnapshotStore.indexName, protectionClass: .complete)
        let acknowledgement = SendableAcknowledgement(acknowledgementHandler)
        index.indexSearchableItems(entries.map(\.searchableItem)) { _ in
            acknowledgement.call()
        }
    }
}

private final class SendableAcknowledgement: @unchecked Sendable {
    private let handler: () -> Void

    init(_ handler: @escaping () -> Void) {
        self.handler = handler
    }

    func call() {
        handler()
    }
}
