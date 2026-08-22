import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { globPaths } from "./glob-paths.ts";

const temporaryDirectories: string[] = [];

afterEach(async () => {
	await Promise.all(
		temporaryDirectories
			.splice(0)
			.map((directory) => rm(directory, { force: true, recursive: true })),
	);
});

describe("globPaths", () => {
	test("returns matching paths in deterministic order", async () => {
		const directory = await mkdtemp(join(tmpdir(), "s-private-glob-"));
		temporaryDirectories.push(directory);
		await mkdir(join(directory, "nested"));
		await Promise.all([
			writeFile(join(directory, "z.md"), "z"),
			writeFile(join(directory, "a.md"), "a"),
			writeFile(join(directory, "nested/b.md"), "b"),
			writeFile(join(directory, "ignored.txt"), "ignored"),
		]);

		await expect(globPaths("**/*.md", { cwd: directory })).resolves.toEqual([
			"a.md",
			"nested/b.md",
			"z.md",
		]);
	});
});
