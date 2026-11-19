import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
// oxlint-disable-next-line vitest/no-import-node-test -- CI validates test selection before any pnpm dependencies are installed.
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
function selection(group) {
	const result = spawnSync(
		"/bin/bash",
		["apps/ios/scripts/test-without-building.sh", "--print-selection", group],
		{ cwd: root, encoding: "utf8" },
	);
	assert.equal(result.status, 0, result.stderr);
	return result.stdout.trim().split("\n").filter(Boolean);
}
const selects = (identifier, prefix) =>
	identifier === prefix || identifier.startsWith(`${prefix}/`);
function includes(identifier, arguments_) {
	const only = arguments_
		.filter((value) => value.startsWith("-only-testing:"))
		.map((value) => value.slice("-only-testing:".length));
	const skip = arguments_
		.filter((value) => value.startsWith("-skip-testing:"))
		.map((value) => value.slice("-skip-testing:".length));
	return (
		(only.length === 0 || only.some((prefix) => selects(identifier, prefix))) &&
		!skip.some((prefix) => selects(identifier, prefix))
	);
}

test("every UI test runs in exactly one CI group, including future tests", () => {
	const groups = ["unit", "rss", "navigation", "ui"].map((group) =>
		selection(group),
	);
	let count = 0;
	for (const file of readdirSync(
		new URL("../apps/ios/SPrivateUITests/", import.meta.url),
	).filter((candidate) => candidate.endsWith(".swift"))) {
		const source = readFileSync(
			new URL(`../apps/ios/SPrivateUITests/${file}`, import.meta.url),
			"utf8",
		);
		const className = source.match(/final class (\w+): XCTestCase/u)?.[1];
		assert.ok(className, file);
		for (const [, method] of source.matchAll(/func (test\w+)\(/gu)) {
			const identifier = `SPrivateUITests/${className}/${method}`;
			assert.equal(
				groups.filter((group) => includes(identifier, group)).length,
				1,
				identifier,
			);
			count++;
		}
	}
	assert.ok(count > 0);
	assert.ok(
		includes("SPrivateUITests/FutureUITests/testFutureCase", groups[3]),
	);
	assert.ok(includes("SPrivateTests/FutureTests/testFutureCase", groups[0]));
});

test("local execution defaults to all tests and rejects unknown groups", () => {
	assert.deepEqual(selection("all"), []);
	const result = spawnSync(
		"/bin/bash",
		["apps/ios/scripts/test-without-building.sh", "--print-selection", "typo"],
		{ cwd: root },
	);
	assert.equal(result.status, 2);
});
