import JSON5 from "json5";
import { readFileSync } from "node:fs";
import { defineConfig } from "vite-plus";

// Keep the existing tool-specific settings as the source of truth during the
// staged migration. Vite+ reads them through this workspace-root config.
const lint = JSON5.parse(
	readFileSync(new URL("./.oxlintrc.json", import.meta.url), "utf8"),
);
const fmt = JSON.parse(
	readFileSync(new URL("./.oxfmtrc.json", import.meta.url), "utf8"),
);

export default defineConfig({ lint, fmt });
