import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, test } from "vitest";

const configPath = fileURLToPath(new URL("../tsconfig.json", import.meta.url));
const config = ts.readConfigFile(configPath, ts.sys.readFile);
const { options } = ts.parseJsonConfigFileContent(
	config.config,
	ts.sys,
	fileURLToPath(new URL("../", import.meta.url)),
);
const compositionPath = fileURLToPath(
	new URL("./api/composition.ts", import.meta.url),
);

describe("backend core package resolution", () => {
	test.each([
		"shared-kernel/services/storage-service.interface",
		"articles/services/articles-domain-service",
		"articles/services/category-service",
		"books/services/books-domain-service",
		"images/services/images-domain-service",
		"notes/services/notes-domain-service",
	])("resolves %s in Vercel and ESM type checking", (subpath) => {
		const specifier = `@s-hirano-ist/s-core/${subpath}`;
		// Vercel's language service calls resolveModuleName without resolutionMode.
		const vercelResolution = ts.resolveModuleName(
			specifier,
			compositionPath,
			options,
			ts.sys,
		).resolvedModule;
		const esmResolution = ts.resolveModuleName(
			specifier,
			compositionPath,
			options,
			ts.sys,
			undefined,
			undefined,
			ts.ModuleKind.ESNext,
		).resolvedModule;

		expect(vercelResolution).toBeDefined();
		expect(vercelResolution?.resolvedFileName).toBe(
			fileURLToPath(
				new URL(`../../../packages/core/${subpath}.ts`, import.meta.url),
			),
		);
		expect(esmResolution?.resolvedFileName).toBe(
			vercelResolution?.resolvedFileName,
		);
	});
});
