#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PKG_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$PKG_DIR/../.." && pwd)"
OUT_DIR="$REPO_ROOT/docs/api/database"

echo "Generating ER diagram from Prisma schema..."
cd "$PKG_DIR"
pnpm prisma:generate

ERD_FILE="$PKG_DIR/erd/schema.md"
if [ ! -f "$ERD_FILE" ]; then
  echo "Error: ERD file not generated at $ERD_FILE" >&2
  exit 1
fi

# Extract mermaid block (strip the ```mermaid fences)
MERMAID_CONTENT="$(sed -n '/^```mermaid$/,/^```$/p' "$ERD_FILE" | sed '1d;$d')"

mkdir -p "$OUT_DIR"

echo "Generating HTML page..."
cat > "$OUT_DIR/index.html" <<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Database Schema - s-private</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #1a1a2e;
      color: #e0e0e0;
      min-height: 100vh;
    }
    header {
      background: #16213e;
      border-bottom: 1px solid #0f3460;
      padding: 1rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }
    header h1 { font-size: 1.25rem; font-weight: 600; }
    nav { display: flex; gap: 1rem; }
    nav a {
      color: #53a8ff;
      text-decoration: none;
      font-size: 0.875rem;
    }
    nav a:hover { text-decoration: underline; }
    main {
      padding: 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .diagram-container {
      width: 100%;
      max-width: 100%;
      overflow: auto;
      background: #fff;
      border-radius: 8px;
      padding: 1rem;
    }
    .diagram-container .mermaid {
      display: flex;
      justify-content: center;
    }
    footer {
      text-align: center;
      padding: 1rem;
      font-size: 0.75rem;
      color: #888;
    }
  </style>
</head>
<body>
  <header>
    <h1>Database Schema</h1>
    <nav>
      <a href="../index.html">API Docs</a>
      <a href="https://github.com/s-hirano-ist/s-private">GitHub</a>
    </nav>
  </header>
  <main>
    <div class="diagram-container">
      <pre class="mermaid">
$MERMAID_CONTENT
      </pre>
    </div>
  </main>
  <footer>
    Auto-generated from Prisma schema
  </footer>
  <script type="module">
    import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
    mermaid.initialize({ startOnLoad: true, theme: "default" });
  </script>
</body>
</html>
HTML

echo "Database docs generated at $OUT_DIR"
