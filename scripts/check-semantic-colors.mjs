import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import ts from "typescript";

const root = resolve(import.meta.dirname, "..");
const sourceDirectories = ["app/src", "packages/ui/src"];
const palettes = new Set([
	"slate",
	"gray",
	"zinc",
	"neutral",
	"stone",
	"red",
	"orange",
	"amber",
	"yellow",
	"lime",
	"green",
	"emerald",
	"teal",
	"cyan",
	"sky",
	"blue",
	"indigo",
	"violet",
	"purple",
	"fuchsia",
	"pink",
	"rose",
]);
const semanticColors = new Set([
	"background",
	"foreground",
	"primary",
	"primary-grad",
	"primary-foreground",
	"muted",
	"muted-foreground",
	"destructive",
	"destructive-foreground",
	"success",
	"rating",
	"overlay",
	"nav-surface",
	"nav-border",
	"media-surface",
]);
const colorUtility =
	/^(bg|text|border(?:-[lrtbxyse])?|ring(?:-offset)?|fill|stroke|from|via|to|decoration|outline|caret|accent|shadow)-(.+)$/u;
const nonColorValues = new Set([
	"transparent",
	"current",
	"inherit",
	"none",
	"auto",
]);
const structuralValues =
	/^(?:bg-(?:linear|radial|conic)(?:-.+)?|bg-(?:clip|origin|repeat|size|position)-.+|bg-(?:cover|contain|center|top|bottom|left|right|fixed|local|scroll)|text-(?:xs|sm|base|lg|xl|[2-9]xl|left|right|center|justify|start|end|ellipsis|clip|wrap|nowrap|balance|pretty)|border-(?:solid|dashed|dotted|double|hidden|none|collapse|separate|\d+)|ring-(?:\d+|inset)|outline-(?:none|hidden|solid|dashed|dotted|double|\d+)|stroke-\d+|shadow-(?:2xs|xs|sm|md|lg|xl|2xl|none|inner))$/u;

function lastUnnestedColon(value) {
	let depth = 0;
	let index = -1;
	for (const [i, char] of [...value].entries()) {
		if (char === "[" || char === "(") depth += 1;
		else if (char === "]" || char === ")") depth -= 1;
		else if (char === ":" && depth === 0) index = i;
	}
	return index;
}

function isAllowedColor(candidate, family, color) {
	return (
		semanticColors.has(color) ||
		nonColorValues.has(color) ||
		structuralValues.test(candidate) ||
		/^(?:\d+(?:\/\d+)?|\[\d+(?:\.\d+)?(?:px|rem|em|%|ch|vw|vh)\])$/u.test(
			color,
		) ||
		(family === "bg" && /^\[url\(.+\)\]$/u.test(color)) ||
		(family === "shadow" &&
			/^\[.*var\(--sui-[a-z-]+\).*\]$/u.test(color) &&
			!/#[\da-f]{3,8}/iu.test(color))
	);
}

export function invalidColorUtilities(value) {
	const invalid = [];
	for (const token of value.split(/\s+/u)) {
		const candidate = token
			.slice(lastUnnestedColon(token) + 1)
			.replace(/^!/u, "")
			.replace(/!$/u, "");
		const match = colorUtility.exec(candidate);
		if (!match) continue;
		const [, family, rawValue] = match;
		const color = rawValue.replace(/\/\d{1,3}$/u, "");
		if (isAllowedColor(candidate, family, color)) continue;
		if (
			/^(?:white|black)$/u.test(color) ||
			palettes.has(color.split("-")[0]) ||
			/^(?:\[|\()/u.test(color)
		)
			invalid.push(token);
	}
	return invalid;
}

async function* sourceFiles(directory) {
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) yield* sourceFiles(path);
		else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".css"))
			yield path;
	}
}

function stringsInTsx(content, filename) {
	const source = ts.createSourceFile(
		filename,
		content,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TSX,
	);
	const values = [];
	function visit(node) {
		if (
			ts.isStringLiteral(node) ||
			ts.isNoSubstitutionTemplateLiteral(node) ||
			ts.isTemplateHead(node) ||
			ts.isTemplateMiddle(node) ||
			ts.isTemplateTail(node)
		) {
			values.push({
				text: node.text,
				line:
					source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
			});
		}
		ts.forEachChild(node, visit);
	}
	visit(source);
	return values;
}

async function main() {
	const errors = [];
	for (const directory of sourceDirectories) {
		for await (const filename of sourceFiles(join(root, directory))) {
			const content = await readFile(filename, "utf8");
			const values = filename.endsWith(".tsx")
				? stringsInTsx(content, filename)
				: [...content.matchAll(/@apply\s+(\S[^;]*);/gu)].map((match) => ({
						text: match[1],
						line: content.slice(0, match.index).split("\n").length,
					}));
			for (const { text, line } of values) {
				for (const utility of invalidColorUtilities(text)) {
					errors.push(`${relative(root, filename)}:${line}: ${utility}`);
				}
			}
		}
	}
	if (errors.length > 0) {
		console.error(
			`Use semantic color tokens instead of Tailwind palette or arbitrary colors:\n${errors.join("\n")}`,
		);
		process.exitCode = 1;
	} else {
		console.log("Semantic color check passed.");
	}
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
	await main();
}
