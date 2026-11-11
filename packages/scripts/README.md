# @s-hirano-ist/s-scripts

CLI scripts for s-private data operations.

The npm artifact bundles the required internal workspace code and generated Prisma client. Consumers install only this CLI package; internal s-private packages are not separate npm dependencies. Command names remain unchanged.

## Installation

```sh
pnpm add @s-hirano-ist/s-scripts
```

## Commands

### Content

```sh
s-content-format
fetch-articles
fetch-books
fetch-images
fetch-notes
```

### Ingest

```sh
ingest-articles
ingest-books
ingest-images
ingest-notes
```

### Reset

```sh
reset-articles
reset-books
reset-images
reset-notes
```

### Revert

```sh
revert-articles
revert-books
revert-images
revert-notes
```

### RAG

```sh
rag-ingest
rag-search
rag-delete-collection
```

### Maintenance

```sh
cleanup-minio-images
enrich-books
find-duplicate-json-articles
fix-book-frontmatter
fix-image-formats
update-json-articles
update-raw-articles
validate-json-articles
```

## License

AGPL-3.0

## Operational notifications

Set `NEXT_PUBLIC_SENTRY_DSN` to record CLI errors in Sentry. If it is missing, the command warns and continues with local diagnostics. Set `PUSHOVER_USER_KEY` and `PUSHOVER_APP_TOKEN` for completion and critical alerts; `PUSHOVER_URL` defaults to `https://api.pushover.net/1/messages.json`.

Unexpected item failures go to Sentry only. A failure that aborts the command, including initialization or cleanup, also sends a critical Pushover alert and sets a nonzero exit code. Existing completion notifications use Pushover only; auxiliary commands do not add success notifications. Expected usage and content validation failures keep their nonzero exit codes without critical alerts.

Notification delivery errors go to Sentry without changing the command's result or sending another Pushover alert. Commands wait up to two seconds for Sentry to flush before exiting; Pushover requests have a five-second timeout. Commands running with `--dry-run` do not initialize Sentry or send external notifications.
