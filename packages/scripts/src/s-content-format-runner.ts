import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

const CONTENT_EXTENSIONS = [
	".md",
	".markdown",
	".json",
	".jsonc",
	".json5",
	".yml",
	".yaml",
] as const;

const DEFAULT_EXCLUDES = [
	"!**/node_modules",
	"!**/dist",
	"!**/build",
	"!**/coverage",
	"!**/raw/article/**",
	"!**/bun.lock",
	"!**/package-lock.json",
	"!**/yarn.lock",
	"!**/.env",
	"!**/.env.*",
] as const;

type OxfmtPackageManifest = {
	bin?: Record<string, string> | string;
};

export type ContentFormatResult = {
	code: number | null;
	signal: NodeJS.Signals | null;
};

function resolveOxfmtBin(): string {
	const packageJsonPath = require.resolve("oxfmt/package.json");
	const manifest = JSON.parse(
		readFileSync(packageJsonPath, "utf8"),
	) as OxfmtPackageManifest;
	const bin =
		typeof manifest.bin === "string" ? manifest.bin : manifest.bin?.oxfmt;

	if (bin === undefined) {
		throw new Error("The installed oxfmt package does not expose an oxfmt bin");
	}

	return path.resolve(path.dirname(packageJsonPath), bin);
}

function isContentFile(target: string): boolean {
	const lowerTarget = target.toLowerCase();
	return CONTENT_EXTENSIONS.some((extension) =>
		lowerTarget.endsWith(extension),
	);
}

function toContentTargets(target: string): string[] {
	if (isContentFile(target)) {
		return [target];
	}

	let normalizedTarget = target.replaceAll("\\", "/");
	while (normalizedTarget.endsWith("/")) {
		normalizedTarget = normalizedTarget.slice(0, -1);
	}
	const base = normalizedTarget === "" ? "." : normalizedTarget;
	return CONTENT_EXTENSIONS.map((extension) => `${base}/**/*${extension}`);
}

export function buildOxfmtArgs(rawArgs: readonly string[]): string[] {
	const isCheck = rawArgs.includes("--check");
	const remaining = rawArgs.filter((arg) => arg !== "--check");
	const options = remaining.filter((arg) => arg.startsWith("-"));
	const paths = remaining.filter((arg) => !arg.startsWith("-"));
	const contentTargets = (paths.length === 0 ? ["."] : paths).flatMap(
		(target) => toContentTargets(target),
	);
	const packageRoot = path.resolve(import.meta.dirname, "..");
	const configPath = path.join(packageRoot, "configs", "oxfmt.json");

	return [
		isCheck ? "--check" : "--write",
		"--config",
		configPath,
		"--disable-nested-config",
		"--no-error-on-unmatched-pattern",
		...options,
		...contentTargets,
		...DEFAULT_EXCLUDES,
	];
}

export function runContentFormat(
	rawArgs: readonly string[],
	cwd = process.cwd(),
): Promise<ContentFormatResult> {
	const child = spawn(
		process.execPath,
		[resolveOxfmtBin(), ...buildOxfmtArgs(rawArgs)],
		{ cwd, stdio: "inherit" },
	);

	return new Promise((resolve, reject) => {
		child.once("error", reject);
		child.once("exit", (code, signal) => resolve({ code, signal }));
	});
}
