import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "..");
const publicPaths = new Set(["packages/ui", "packages/scripts"]);
const readJson = async (file) =>
	JSON.parse(await readFile(path.join(root, file), "utf8"));
for (const container of ["apps", "packages"]) {
	for (const name of await readdir(path.join(root, container))) {
		const directory = `${container}/${name}`;
		if (!(await readdir(path.join(root, directory))).includes("package.json"))
			continue;
		const manifest = await readJson(`${directory}/package.json`);
		assert.equal(
			manifest.private !== true,
			publicPaths.has(directory),
			`Unexpected publication policy: ${directory}`,
		);
	}
}
const releases = await readJson(".release-please-config.json");
assert.deepEqual(
	Object.keys(releases.packages).toSorted(),
	[".", "packages/ui"].toSorted(),
	"Internal packages must not have independent releases",
);
assert.deepEqual(
	releases.packages["."]["extra-files"],
	[
		{
			type: "json",
			path: "packages/scripts/package.json",
			jsonpath: "$.version",
		},
	],
	"Root releases must update the bundled CLI version",
);
const source = await readJson("packages/scripts/package.json");
const artifact = await readJson("packages/scripts/dist-package/package.json");
assert.deepEqual(
	artifact.bin,
	source.bin,
	"CLI command names and paths must remain unchanged",
);
assert.equal(artifact.name, source.name);
assert.equal(artifact.version, source.version);
for (const [name, range] of Object.entries(artifact.dependencies)) {
	assert.ok(
		!name.startsWith("@s-hirano-ist/"),
		`CLI requires unpublished workspace package: ${name}`,
	);
	assert.ok(
		!/^(?:workspace|catalog|link|file):/u.test(range),
		`Non-portable dependency: ${name}`,
	);
}
for (const file of Object.values(artifact.bin))
	await readFile(path.join(root, "packages/scripts/dist-package", file));
console.log("Publication boundary passed: UI and self-contained CLI only.");
