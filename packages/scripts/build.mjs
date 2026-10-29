import { build } from "esbuild";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { isBuiltin } from "node:module";
import path from "node:path";

const root = import.meta.dirname;
const workspace = path.resolve(root, "../..");
const destination = path.join(root, "dist-package");
const manifest = JSON.parse(
	await readFile(path.join(root, "package.json"), "utf8"),
);
const packages = new Map();
for (const directory of await readdir(path.join(workspace, "packages"))) {
	const location = path.join(workspace, "packages", directory);
	const data = JSON.parse(
		await readFile(path.join(location, "package.json"), "utf8"),
	);
	packages.set(data.name, { location, manifest: data });
}
const runtimeDependencies = new Map();
const visited = new Set();
async function collect(name) {
	if (visited.has(name)) return;
	visited.add(name);
	const current = packages.get(name);
	if (!current) throw new Error(`Unknown workspace dependency: ${name}`);
	for (const [dependency, range] of Object.entries(
		current.manifest.dependencies ?? {},
	)) {
		if (packages.has(dependency)) {
			await collect(dependency);
			continue;
		}
		const installed = JSON.parse(
			await readFile(
				path.join(current.location, "node_modules", dependency, "package.json"),
				"utf8",
			),
		);
		const version = range.startsWith("catalog:") ? installed.version : range;
		const previous = runtimeDependencies.get(dependency);
		if (previous && previous !== version)
			throw new Error(`Conflicting CLI dependency: ${dependency}`);
		runtimeDependencies.set(dependency, version);
	}
}
await collect(manifest.name);
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
const externalDependencies = new Set();
const result = await build({
	absWorkingDir: root,
	entryPoints: Object.fromEntries(
		Object.entries(manifest.bin).map(([_name, file]) => [
			file.replace(/^\.\/dist\//u, "").replace(/\.js$/u, ""),
			`src/${file.replace(/^\.\/dist\//u, "").replace(/\.js$/u, ".ts")}`,
		]),
	),
	outdir: path.join(destination, "dist"),
	bundle: true,
	splitting: true,
	format: "esm",
	platform: "node",
	target: "node24",
	chunkNames: "chunk-[hash]",
	metafile: true,
	legalComments: "eof",
	banner: {
		js: 'import { createRequire as __cliCreateRequire } from "node:module"; const require = __cliCreateRequire(import.meta.url);',
	},
	plugins: [
		{
			name: "internal-workspace-only",
			setup(builder) {
				// oxlint-disable-next-line require-unicode-regexp -- esbuild uses Go regexp syntax without a Unicode flag
				builder.onResolve({ filter: /^[^./]/ }, ({ path: specifier }) => {
					if (specifier.startsWith("@s-hirano-ist/")) return;
					if (!isBuiltin(specifier))
						externalDependencies.add(
							specifier.startsWith("@")
								? specifier.split("/").slice(0, 2).join("/")
								: specifier.split("/")[0],
						);
					return { path: specifier, external: true };
				});
			},
		},
	],
});
// import.meta.resolve is deliberately dynamic, so retain the CLI's declared tool dependency.
externalDependencies.add("oxfmt");
const dependencies = {};
for (const name of [...externalDependencies].toSorted()) {
	const version = runtimeDependencies.get(name);
	if (!version) throw new Error(`Undeclared CLI runtime dependency: ${name}`);
	dependencies[name] = version;
}
for (const filename of ["README.md", "LICENSE", "configs"])
	await cp(path.join(root, filename), path.join(destination, filename), {
		recursive: true,
	});
const {
	scripts: _scripts,
	devDependencies: _devDependencies,
	publishConfig: _publishConfig,
	...metadata
} = manifest;
await writeFile(
	path.join(destination, "package.json"),
	JSON.stringify(
		{ ...metadata, dependencies, publishConfig: { access: "public" } },
		null,
		2,
	) + "\n",
);
await writeFile(
	path.join(root, "dist", "bundle-inputs.json"),
	JSON.stringify(Object.keys(result.metafile.inputs), null, 2) + "\n",
);
console.log(
	`CLI artifact: ${Object.keys(manifest.bin).length} commands; ${externalDependencies.size} external dependencies; no workspace packages.`,
);
