#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const FORBIDDEN = ["GPL", "GPL-2.0", "GPL-3.0", "LGPL", "LGPL-3.0"];

const result = spawnSync("pnpm", ["licenses", "list", "--json"], {
	encoding: "utf8",
	maxBuffer: 64 * 1024 * 1024,
});

if (result.status !== 0) {
	process.stderr.write(result.stderr || "");
	process.exit(result.status ?? 1);
}

const data = JSON.parse(result.stdout);

const violations = [];
for (const [licenseKey, packages] of Object.entries(data)) {
	const tokens = licenseKey
		.split(/\s+(?:AND|OR)\s+|[(),]/i)
		.map((s) => s.trim().replace(/^\++|\++$/g, ""))
		.filter(Boolean);
	const hit = tokens.some((token) => FORBIDDEN.includes(token));
	if (!hit) continue;
	for (const pkg of packages) {
		violations.push({
			name: pkg.name,
			version: (pkg.versions ?? []).join(", "),
			license: licenseKey,
		});
	}
}

if (violations.length === 0) {
	console.log("OK: no forbidden licenses found.");
	process.exit(0);
}

console.error("ERROR: Forbidden licenses detected");
for (const v of violations) {
	console.error(`  - ${v.name}@${v.version} (${v.license})`);
}
process.exit(1);
