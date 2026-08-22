import { spawnSync } from "node:child_process";

const gitleaks = process.platform === "win32" ? "gitleaks.exe" : "gitleaks";
const syntheticSuffix = "aB3dE5fG7hJ9kL2mN4pQ6rS8tV0wX1yZ3cD5e".slice(0, 36);
const syntheticSecret = ["gh", "p_", syntheticSuffix].join("");
const selfTest = spawnSync(gitleaks, ["stdin", "--redact=100", "--no-banner"], {
	encoding: "utf8",
	input: `token=${syntheticSecret}\n`,
});

if (selfTest.error) {
	console.error(`Failed to start Gitleaks: ${selfTest.error.message}`);
	process.exit(2);
}

if (selfTest.status !== 1) {
	console.error(
		`Gitleaks self-test failed: expected a finding (exit 1), received exit ${String(selfTest.status)}.`,
	);
	process.exit(2);
}

const scan = spawnSync(gitleaks, ["dir", "--redact=100", "--no-banner", "."], {
	stdio: "inherit",
});

if (scan.error) {
	console.error(`Failed to start Gitleaks: ${scan.error.message}`);
	process.exit(2);
}

process.exit(scan.status ?? 2);
