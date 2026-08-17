#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const mode = process.argv[2];
if (mode !== "sync" && mode !== "check") {
	console.error("Usage: node scripts/harness.mjs <sync|check>");
	process.exit(2);
}

const repoRoot = path.resolve(import.meta.dirname, "..");
const harnessDir = path.join(repoRoot, ".harness");
const canonicalSkillsDir = path.join(harnessDir, "skills");
const adapterSkillDirs = [
	path.join(repoRoot, ".agents", "skills"),
	path.join(repoRoot, ".claude", "skills"),
];
const errors = [];

const skillNames = fs
	.readdirSync(canonicalSkillsDir, { withFileTypes: true })
	.filter((entry) => entry.isDirectory())
	.map((entry) => entry.name)
	.toSorted();

if (mode === "sync") {
	synchronizeLink(
		path.join(repoRoot, "AGENTS.md"),
		path.join(harnessDir, "instructions.md"),
	);
	synchronizeLink(
		path.join(repoRoot, "CLAUDE.md"),
		path.join(harnessDir, "instructions.md"),
	);

	for (const adapterDir of adapterSkillDirs) {
		fs.mkdirSync(adapterDir, { recursive: true });
		synchronizeSkillLinks(adapterDir);
	}
}

validateInstructionLinks();
validateSkills();
validateHookConfiguration();

if (errors.length > 0) {
	for (const error of errors) {
		console.error(`- ${error}`);
	}
	process.exit(1);
}

console.log(`Harness ${mode} passed for ${skillNames.length} skills.`);

function synchronizeSkillLinks(adapterDir) {
	const expectedNames = new Set(skillNames);

	for (const entry of fs.readdirSync(adapterDir, { withFileTypes: true })) {
		const entryPath = path.join(adapterDir, entry.name);
		if (expectedNames.has(entry.name)) {
			continue;
		}
		if (entry.isSymbolicLink()) {
			fs.unlinkSync(entryPath);
			continue;
		}
		throw new Error(
			`Refusing to remove unmanaged harness entry: ${relative(entryPath)}`,
		);
	}

	for (const skillName of skillNames) {
		synchronizeLink(
			path.join(adapterDir, skillName),
			path.join(canonicalSkillsDir, skillName),
		);
	}
}

function synchronizeLink(linkPath, targetPath) {
	const expectedTarget = path.relative(path.dirname(linkPath), targetPath);
	let metadata;

	try {
		metadata = fs.lstatSync(linkPath);
	} catch (error) {
		if (error.code !== "ENOENT") {
			throw error;
		}
	}

	if (
		metadata?.isSymbolicLink() &&
		fs.readlinkSync(linkPath) === expectedTarget
	) {
		return;
	}
	if (metadata?.isSymbolicLink()) {
		fs.unlinkSync(linkPath);
	} else if (metadata !== undefined) {
		throw new Error(
			`Refusing to replace non-symlink harness entry: ${relative(linkPath)}`,
		);
	}

	fs.symlinkSync(expectedTarget, linkPath);
}

function validateInstructionLinks() {
	for (const name of ["AGENTS.md", "CLAUDE.md"]) {
		validateLink(
			path.join(repoRoot, name),
			path.join(harnessDir, "instructions.md"),
		);
	}
}

function validateSkills() {
	if (skillNames.length === 0) {
		errors.push("No canonical skills found in .harness/skills.");
	}
	validateCanonicalSkills();
	validateAdapterSkills();
	validateSkillReferences();
}

function validateCanonicalSkills() {
	for (const skillName of skillNames) {
		if (!/^[a-z0-9-]{1,64}$/u.test(skillName)) {
			errors.push(`Invalid skill directory name: ${skillName}`);
		}

		const skillFile = path.join(canonicalSkillsDir, skillName, "SKILL.md");
		if (!fs.existsSync(skillFile)) {
			errors.push(`Missing SKILL.md: ${relative(skillFile)}`);
			continue;
		}
		validateFrontmatter(skillFile, skillName);
	}
}

function validateAdapterSkills() {
	for (const adapterDir of adapterSkillDirs) {
		const actualNames = fs.existsSync(adapterDir)
			? fs.readdirSync(adapterDir).toSorted()
			: [];
		for (const unexpectedName of actualNames.filter(
			(name) => !skillNames.includes(name),
		)) {
			errors.push(
				`Unexpected adapter skill: ${relative(path.join(adapterDir, unexpectedName))}`,
			);
		}
		for (const skillName of skillNames) {
			validateLink(
				path.join(adapterDir, skillName),
				path.join(canonicalSkillsDir, skillName),
			);
		}
	}
}

function validateSkillReferences() {
	const forbiddenPattern =
		/\.Codex\/skills|\.claude\/skills|\.agents\/skills|CLAUDE\.md/u;
	for (const filePath of walkFiles(canonicalSkillsDir)) {
		if (!filePath.endsWith(".md")) {
			continue;
		}
		const contents = fs.readFileSync(filePath, "utf8");
		if (forbiddenPattern.test(contents)) {
			errors.push(`Host-specific reference remains in ${relative(filePath)}.`);
		}
	}
}

function validateFrontmatter(skillFile, expectedName) {
	const contents = fs.readFileSync(skillFile, "utf8");
	const match = /^---\n([\s\S]*?)\n---(?:\n|$)/u.exec(contents);
	if (match === null) {
		errors.push(`Invalid frontmatter delimiters: ${relative(skillFile)}`);
		return;
	}

	const frontmatter = match[1];
	const frontmatterLines = frontmatter.split("\n");
	const topLevelLines = frontmatterLines.filter(
		(line) => line.length > 0 && !/^\s/u.test(line),
	);
	const keys = topLevelLines.map((line) => line.slice(0, line.indexOf(":")));
	if (keys.join(",") !== "name,description") {
		errors.push(
			`Frontmatter must contain only name and description in ${relative(skillFile)}.`,
		);
	}

	const nameLine = topLevelLines.find((line) => line.startsWith("name:"));
	const name = nameLine?.slice("name:".length).trim();
	if (name !== expectedName) {
		errors.push(
			`Skill name must match its directory in ${relative(skillFile)}.`,
		);
	}

	const descriptionIndex = frontmatterLines.findIndex((line) =>
		line.startsWith("description:"),
	);
	const descriptionLine = frontmatterLines[descriptionIndex];
	const hasInlineDescription =
		descriptionLine?.slice("description:".length).trim().length > 0;
	const hasMultilineDescription = frontmatterLines
		.slice(descriptionIndex + 1)
		.some((line) => /^\s+\S/u.test(line));
	if (!hasInlineDescription && !hasMultilineDescription) {
		errors.push(`Skill description is empty in ${relative(skillFile)}.`);
	}
}

function validateHookConfiguration() {
	const claudeSettings = readJson(
		path.join(repoRoot, ".claude", "settings.json"),
	);
	const codexHooks = readJson(path.join(repoRoot, ".codex", "hooks.json"));
	if (claudeSettings === undefined || codexHooks === undefined) {
		return;
	}

	const claudeStopHooks = claudeSettings.hooks?.Stop;
	const codexStopHooks = codexHooks.hooks?.Stop;
	if (!Array.isArray(claudeStopHooks) || claudeStopHooks.length !== 1) {
		errors.push("Claude settings must define exactly one Stop hook group.");
	}
	if (!Array.isArray(codexStopHooks) || codexStopHooks.length !== 1) {
		errors.push("Codex settings must define exactly one Stop hook group.");
	}
	if (claudeSettings.hooks?.Notification !== undefined) {
		errors.push("The legacy Claude Notification hook must be removed.");
	}

	const claudeCommand = claudeStopHooks?.[0]?.hooks?.[0]?.command;
	const codexCommand = codexStopHooks?.[0]?.hooks?.[0]?.command;
	if (typeof claudeCommand !== "string" || claudeCommand !== codexCommand) {
		errors.push("Claude and Codex Stop hooks must invoke the same command.");
	}
	if (!claudeCommand?.includes(".harness/hooks/check-fix.mjs")) {
		errors.push("Stop hooks must invoke the canonical check-fix hook.");
	}
}

function validateLink(linkPath, targetPath) {
	let metadata;
	try {
		metadata = fs.lstatSync(linkPath);
	} catch {
		errors.push(`Missing symlink: ${relative(linkPath)}`);
		return;
	}

	if (!metadata.isSymbolicLink()) {
		errors.push(`Expected symlink: ${relative(linkPath)}`);
		return;
	}

	const expectedTarget = path.relative(path.dirname(linkPath), targetPath);
	const actualTarget = fs.readlinkSync(linkPath);
	if (actualTarget !== expectedTarget) {
		errors.push(
			`Wrong symlink target for ${relative(linkPath)}: ${actualTarget} (expected ${expectedTarget})`,
		);
	}
	if (!fs.existsSync(linkPath)) {
		errors.push(`Broken symlink: ${relative(linkPath)}`);
	}
}

function readJson(filePath) {
	try {
		return JSON.parse(fs.readFileSync(filePath, "utf8"));
	} catch (error) {
		errors.push(`Invalid JSON in ${relative(filePath)}: ${error.message}`);
	}
}

function walkFiles(directory) {
	return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const entryPath = path.join(directory, entry.name);
		return entry.isDirectory() ? walkFiles(entryPath) : [entryPath];
	});
}

function relative(filePath) {
	return path.relative(repoRoot, filePath);
}
