#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PKG_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$PKG_DIR/../.." && pwd)"
OUT_DIR="$REPO_ROOT/docs/api/database"

# 1. Generate DBML from Prisma schema
echo "Generating DBML from Prisma schema..."
cd "$PKG_DIR"
npx prisma generate --generator dbml

DBML_FILE="$PKG_DIR/dbml/schema.dbml"
if [ ! -f "$DBML_FILE" ]; then
  echo "Error: DBML file not generated at $DBML_FILE" >&2
  exit 1
fi

# 2. Convert DBML to SVG
echo "Converting DBML to SVG..."
mkdir -p "$OUT_DIR"
npx dbml-renderer -i "$DBML_FILE" -o "$OUT_DIR/er-diagram.svg" -f svg

# 3. Generate HTML wrapper page
echo "Generating HTML page..."
cat > "$OUT_DIR/index.html" << 'HTML'
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
    .diagram-container img {
      width: 100%;
      height: auto;
      display: block;
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
      <img src="er-diagram.svg" alt="ER Diagram">
    </div>
  </main>
  <footer>
    Auto-generated from Prisma schema
  </footer>
</body>
</html>
HTML

echo "Database docs generated at $OUT_DIR"
