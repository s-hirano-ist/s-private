import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
	chmodSync,
	copyFileSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

function simulatorStartup(environment = {}) {
	const directory = mkdtempSync(join(tmpdir(), "ios-startup-"));
	try {
		const bin = join(directory, "bin");
		const scripts = join(directory, "apps/ios/scripts");
		const products = join(directory, "apps/ios/.derivedData/Build/Products");
		mkdirSync(bin, { recursive: true });
		mkdirSync(scripts, { recursive: true });
		mkdirSync(join(products, "Debug-iphonesimulator/SPrivate.app"), {
			recursive: true,
		});
		writeFileSync(join(products, "Fixture.xctestrun"), "");
		const script = join(scripts, "test-without-building.sh");
		copyFileSync(
			join(root, "apps/ios/scripts/test-without-building.sh"),
			script,
		);
		const log = join(directory, "calls.jsonl");
		const devices = join(directory, "devices.txt");
		writeFileSync(
			devices,
			`== Devices ==
-- iOS 26.5 --
    iPhone 17 (older-device) (Shutdown)
-- iOS 27.0 --
    iPhone 17 (test-device) (Shutdown)
    CI Audit iPhone 17 (custom-device) (Booted)
`,
		);
		const command = `#!/usr/bin/env node
const fs = require("node:fs");
const name = require("node:path").basename(process.argv[1]);
const args = process.argv.slice(2);
fs.appendFileSync(process.env.IOS_STARTUP_LOG, JSON.stringify({ name, args }) + "\\n");
if (name === "xcrun" && args[1] === "list") {
  process.stdout.write(fs.readFileSync(process.env.IOS_DEVICE_LIST));
}
if (name === "xcrun" && args[1] === "bootstatus" && process.env.IOS_BOOT_FAILURE === "1") {
  process.exit(1);
}
`;
		for (const name of ["xcrun", "xcodebuild"]) {
			writeFileSync(join(bin, name), command);
			chmodSync(join(bin, name), 0o755);
		}
		const result = spawnSync("/bin/bash", [script], {
			cwd: directory,
			encoding: "utf8",
			env: {
				...process.env,
				PATH: `${bin}:${process.env.PATH}`,
				IOS_STARTUP_LOG: log,
				IOS_DEVICE_LIST: devices,
				IOS_SIMULATOR_UDID: "",
				IOS_TEST_GROUP: "all",
				...environment,
			},
		});
		return {
			result,
			calls: readFileSync(log, "utf8")
				.trim()
				.split("\n")
				.map((line) => JSON.parse(line)),
		};
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
}

test("Simulator boot and fixture startup precede XCTest on the same iOS 27 device", () => {
	const { result, calls } = simulatorStartup();
	assert.equal(result.status, 0, result.stderr);
	assert.deepEqual(
		calls.map(({ name, args }) => (name === "xcrun" ? args[1] : name)),
		["list", "boot", "bootstatus", "install", "launch", "xcodebuild"],
	);
	for (const call of calls.slice(1, -1))
		assert.equal(call.args[2], "test-device");
	assert.deepEqual(calls[2].args, [
		"simctl",
		"bootstatus",
		"test-device",
		"-b",
	]);
	assert.deepEqual(calls[4].args.slice(-2), [
		"-ui-testing-authenticated",
		"-ui-testing-list-fixtures",
	]);
	const testArguments = calls.at(-1).args;
	assert.equal(
		testArguments[testArguments.indexOf("-destination") + 1],
		"platform=iOS Simulator,id=test-device",
	);
});

test("an explicitly selected booted Simulator is reused without rebooting it", () => {
	const { result, calls } = simulatorStartup({
		IOS_SIMULATOR_UDID: "custom-device",
	});
	assert.equal(result.status, 0, result.stderr);
	assert.equal(
		calls.some(({ args }) => args[1] === "boot"),
		false,
	);
	assert.deepEqual(calls[1].args, [
		"simctl",
		"bootstatus",
		"custom-device",
		"-b",
	]);
	assert.ok(
		calls.at(-1).args.includes("platform=iOS Simulator,id=custom-device"),
	);
});

test("a failed Simulator boot stops before app installation and XCTest", () => {
	const { result, calls } = simulatorStartup({ IOS_BOOT_FAILURE: "1" });
	assert.equal(result.status, 1);
	assert.deepEqual(
		calls.map(({ args }) => args[1]),
		["list", "boot", "bootstatus"],
	);
});
