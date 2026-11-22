# iOS local intelligence

## Decision

The iOS app uses a private, named Core Spotlight index as its local semantic
retrieval layer. It does not embed Qdrant, SQLite vector extensions, or a second
embedding model in the app.

This is the best default for the iOS client because the same index supports:

- lexical and on-device semantic search through `CSUserQuery`;
- retrieval-augmented answers through Foundation Models'
  `SpotlightSearchTool`;
- Siri, Shortcuts, Spotlight, and system actions through App Intents and indexed
  app entities;
- OS-managed indexing, ranking, storage, and model lifecycle.

The server-side Qdrant index remains the cross-platform search implementation.
The iOS index is an owner-scoped projection of records already cached in
SwiftData; it is not a new source of truth and does not change backend or web
contracts.

## Privacy and lifecycle

Local intelligence is disabled by default. A signed-in user must enable it in
**Settings > Local AI search** before full record text is copied to Core
Spotlight. The choice is stored per owner using a SHA-256-derived owner key.

The named index uses `NSFileProtectionComplete`. Queries request only the
complete protection class, so private content is unavailable while the device
is locked. Stable item identifiers contain an owner digest, domain, and record
ID; the raw authentication subject is never written to Spotlight.

When enabled, the app rebuilds the index from the current owner's SwiftData
cache and then updates it after each sync upsert or deletion. It also writes an
App Group snapshot with complete file protection so the Core Spotlight index
extension and Foundation Models can rehydrate or reindex items. Disabling the
feature, clearing cached data, changing owners, or signing out purges both the
named index and snapshot.

The indexed payload can include titles, URLs, quotes, note Markdown, ISBNs,
categories, and tags. It stays on the device. The current Foundation Models
session uses the on-device system language model and does not make an app-level
network request. Apple controls operating-system behavior and model
availability; the UI therefore describes the feature as local and reports when
Apple Intelligence is unavailable rather than silently falling back to a cloud
model.

## Feature integration

| Surface | Integration | Fallback |
| --- | --- | --- |
| In-app search | `CSUserQuery` with ranked semantic results | Existing SwiftData substring search |
| In-app answers | Foundation Models + `SpotlightSearchTool` with a focused guide | Button hidden when the system model is unavailable |
| Siri / Shortcuts search | `ShowInAppSearchResultsIntent` | Opens the in-app search UI |
| Siri / Shortcuts open | `OpenIntent` + `MemdexContentEntity` | Opens the matching cached record |
| Siri / Shortcuts create | `CreateMemdexNoteIntent` App Shortcut | Writes to the existing offline queue, then syncs |
| Spotlight maintenance | Named protected index + Spotlight index extension | Rebuild from the protected App Group snapshot |

The create-note shortcut intentionally uses a Memdex-specific intent rather
than claiming the Notes domain schema. The current domain does not expose the
folders, attachments, and pinning semantics required for a faithful Notes
entity. A schema-specific intent should be added only when those semantics are
part of the Memdex domain model.

## Availability and build constraints

`SpotlightSearchTool` and its Core Spotlight source are available from iOS 27.
The relevant SDK overlay is arm64-only, matching the Apple silicon and Apple
Intelligence device requirement. The app target therefore excludes x86_64 for
Simulator builds. Development and CI must use an Apple silicon Mac with the
iOS 27 runtime as already required by `apps/ios/README.md`.

Apple Intelligence availability also depends on supported device hardware,
language, region, downloaded model state, and system settings. Semantic
Spotlight search remains useful when the generative model is unavailable.

## When to reconsider a custom vector database

Add a second local vector store only after measurements show that Core
Spotlight cannot meet a concrete requirement. Examples include deterministic
embedding version control, custom distance metrics, offline retrieval on
unsupported OS versions, or recall/latency targets that Spotlight misses.

Before changing the default, benchmark a representative private corpus and
record at least recall@k, first-result latency, index size, incremental indexing
cost, memory pressure, battery impact, app download growth, and migration
behavior. A custom store also needs an embedding runtime, schema/version
migrations, encryption and lock-state handling, deletion guarantees, and a
separate bridge back to Siri and Spotlight. Those costs are why Core Spotlight
is the current choice.

## Design rules for future iOS work

- Expose user-visible content and actions through App Entities, App Intents, and
  App Shortcuts when they map honestly to the domain.
- Prefer system schemas for search and open actions; do not claim a schema whose
  required semantics are absent.
- Keep local intelligence opt-in for private full text and preserve an obvious
  purge path.
- Treat SwiftData and the backend as sources of truth; every Spotlight artifact
  must be reproducible and disposable.
- Use the system language model and focused retrieval before adding an app-owned
  model or vector database.
- Keep a non-generative path for devices where Apple Intelligence is disabled
  or unavailable.
