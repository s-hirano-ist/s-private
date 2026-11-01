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
