import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { buildOxfmtArgs, runContentFormat } from "./s-content-format-runner.js";

const temporaryDirectories: string[] = [];

async function createTemporaryDirectory(): Promise<string> {
	const directory = await mkdtemp(path.join(tmpdir(), "s-content-format-"));
	temporaryDirectories.push(directory);
	return directory;
}

afterEach(async () => {
	await Promise.all(
		temporaryDirectories
			.splice(0)
			.map((directory) => rm(directory, { force: true, recursive: true })),
	);
});

describe("buildOxfmtArgs", () => {
	test("limits the default targets to content file extensions", () => {
		const args = buildOxfmtArgs([]);

		expect(args).toContain("--write");
		expect(args).toContain("--disable-nested-config");
		expect(args).toContain("./**/*.md");
		expect(args).toContain("./**/*.json");
		expect(args).toContain("./**/*.yaml");
		expect(args).not.toContain(".");
	});

	test("preserves a content file and expands a directory", () => {
		const args = buildOxfmtArgs(["--check", "content/book.json", "notes"]);

		expect(args).toContain("--check");
		expect(args).toContain("content/book.json");
		expect(args).toContain("notes/**/*.md");
		expect(args).toContain("notes/**/*.yml");
	});
});

describe("runContentFormat", () => {
	test("formats Markdown, JSON, and YAML without changing source files", async () => {
		const directory = await createTemporaryDirectory();
		const markdownPath = path.join(directory, "content.md");
		const jsonPath = path.join(directory, "content.json");
		const yamlPath = path.join(directory, "content.yaml");
		const typescriptPath = path.join(directory, "source.ts");
		await Promise.all([
			writeFile(markdownPath, "# Title\n\n-   item\n"),
			writeFile(jsonPath, '{"name":"example","enabled":true}\n'),
			writeFile(yamlPath, "name: example\nitems:\n - one\n"),
			writeFile(typescriptPath, "const   value=1\n"),
		]);

		const result = await runContentFormat([], directory, { stdio: "ignore" });

		expect(result).toEqual({ code: 0, signal: null });
		expect(await readFile(markdownPath, "utf8")).not.toContain("-   item");
		expect(await readFile(jsonPath, "utf8")).not.toContain('"name":"example"');
		expect(await readFile(yamlPath, "utf8")).not.toContain("\n - one");
		expect(await readFile(typescriptPath, "utf8")).toBe("const   value=1\n");
	});

	test("check mode reports unformatted files without writing them", async () => {
		const directory = await createTemporaryDirectory();
		const jsonPath = path.join(directory, "content.json");
		const original = '{"name":"example","enabled":true}\n';
		await writeFile(jsonPath, original);

		const unformattedResult = await runContentFormat(["--check"], directory, {
			stdio: "ignore",
		});

		expect(unformattedResult.code).not.toBe(0);
		expect(await readFile(jsonPath, "utf8")).toBe(original);

		expect(
			(await runContentFormat([], directory, { stdio: "ignore" })).code,
		).toBe(0);
		expect(
			(
				await runContentFormat(["--check"], directory, {
					stdio: "ignore",
				})
			).code,
		).toBe(0);
	});

	test("keeps default exclusions and explicit directory boundaries", async () => {
		const directory = await createTemporaryDirectory();
		const selectedDirectory = path.join(directory, "selected");
		const otherDirectory = path.join(directory, "other");
		const rawDirectory = path.join(selectedDirectory, "raw", "article");
		await Promise.all([
			mkdir(selectedDirectory, { recursive: true }),
			mkdir(otherDirectory, { recursive: true }),
			mkdir(rawDirectory, { recursive: true }),
		]);
		const selectedPath = path.join(selectedDirectory, "selected.json");
		const otherPath = path.join(otherDirectory, "other.json");
		const rawPath = path.join(rawDirectory, "raw.md");
		const unformattedJson = '{"name":"example"}\n';
		const unformattedMarkdown = "# Raw\n\n-   item\n";
		await Promise.all([
			writeFile(selectedPath, unformattedJson),
			writeFile(otherPath, unformattedJson),
			writeFile(rawPath, unformattedMarkdown),
		]);

		const result = await runContentFormat(["selected"], directory, {
			stdio: "ignore",
		});

		expect(result.code).toBe(0);
		expect(await readFile(selectedPath, "utf8")).not.toBe(unformattedJson);
		expect(await readFile(otherPath, "utf8")).toBe(unformattedJson);
		expect(await readFile(rawPath, "utf8")).toBe(unformattedMarkdown);
	});
});
