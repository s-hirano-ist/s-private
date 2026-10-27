import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

test("boots the backend through package exports using native Node TypeScript", () => {
	const output = execFileSync(
		process.execPath,
		[fileURLToPath(new URL("../scripts/smoke-runtime.mjs", import.meta.url))],
		{
			encoding: "utf8",
			env: { ...process.env, NODE_OPTIONS: "" },
			timeout: 15000,
		},
	);
	expect(output).toContain("/health: 200");
	expect(output).toContain("/api/v1/session: 401");
});
