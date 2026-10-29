import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "..");
const temporary = await mkdtemp(path.join(os.tmpdir(), "s-cli-consumer-"));
function run(command, args, options = {}) {
	// oxlint-disable-next-line sonarjs/no-os-command-from-path -- fixed local package-manager executables and argument arrays
	return execFileSync(command, args, {
		encoding: "utf8",
		stdio: "pipe",
		...options,
	});
}
try {
	run("pnpm", ["pack", "--pack-destination", temporary], {
		cwd: path.join(root, "packages/scripts"),
	});
	const archive = (await readdir(temporary)).find((file) =>
		file.endsWith(".tgz"),
	);
	assert.ok(archive, "CLI tarball was not generated");
	const consumer = path.join(temporary, "consumer");
	run("npm", [
		"install",
		"--prefix",
		consumer,
		"--no-audit",
		"--no-fund",
		path.join(temporary, archive),
	]);
	const directory = path.join(consumer, "node_modules/@s-hirano-ist/s-scripts");
	const manifest = JSON.parse(
		await readFile(path.join(directory, "package.json"), "utf8"),
	);
	assert.deepEqual(
		await readdir(path.join(consumer, "node_modules/@s-hirano-ist")),
		["s-scripts"],
	);
	for (const bin of Object.values(manifest.bin))
		run(process.execPath, ["--check", path.join(directory, bin)]);
	const output = run(
		process.execPath,
		[path.join(directory, "dist/s-content-format.js"), "--version"],
		{ cwd: consumer },
	);
	assert.match(output, /Version:/u);
	const env = {
		...process.env,
		DATABASE_URL: "postgresql://root@127.0.0.1:1/consumer",
		USERNAME_TO_EXPORT: "consumer-test",
		PUSHOVER_URL: "http://127.0.0.1:1",
		PUSHOVER_USER_KEY: "test",
		PUSHOVER_APP_TOKEN: "test",
	};
	const database = spawnSync(
		process.execPath,
		[path.join(directory, "dist/reset-notes.js")],
		{ cwd: consumer, env, encoding: "utf8", timeout: 30_000 },
	);
	assert.equal(database.status, 1);
	assert.match(
		database.stderr,
		/P1001/u,
		"Bundled Prisma must initialize and reach the deliberately unavailable local database",
	);
	console.log(
		`CLI consumer passed: isolated install, ${Object.keys(manifest.bin).length} commands, formatter and bundled Prisma.`,
	);
} finally {
	await rm(temporary, { recursive: true, force: true });
}
