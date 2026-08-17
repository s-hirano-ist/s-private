import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

const sourceDirectory = new URL("../src/", import.meta.url);

function collectFiles(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) return collectFiles(path);
		if (!entry.name.endsWith(".tsx")) return [];
		if (entry.name.includes(".stories.") || entry.name.includes(".test."))
			return [];
		return [path];
	});
}

function isClassLiteral(node) {
	if (ts.isPropertyAssignment(node.parent) && node.parent.name === node)
		return false;
	for (let current = node.parent; current; current = current.parent) {
		if (
			ts.isPropertyAssignment(current) &&
			current.name.getText() === "defaultVariants"
		)
			return false;
		if (ts.isJsxAttribute(current))
			return current.name.getText() === "className";
		if (ts.isCallExpression(current)) {
			const callee = current.expression.getText();
			return callee === "cn" || callee === "tv";
		}
		if (ts.isStatement(current)) return false;
	}
	return false;
}

function prefixClasses(value) {
	return value
		.split(/(\s+)/u)
		.map((token) =>
			token.trim() && !token.startsWith("sui:") ? `sui:${token}` : token,
		)
		.join("");
}

function collectClassEdits(sourceFile) {
	const edits = [];
	const visit = (node) => {
		if (ts.isStringLiteral(node) && isClassLiteral(node)) {
			const next = prefixClasses(node.text);
			if (next !== node.text) {
				edits.push({
					start: node.getStart(sourceFile) + 1,
					end: node.getEnd() - 1,
					next,
				});
			}
		}
		ts.forEachChild(node, visit);
	};
	visit(sourceFile);
	return edits;
}

for (const file of collectFiles(sourceDirectory.pathname)) {
	const source = readFileSync(file, "utf8");
	const sourceFile = ts.createSourceFile(
		file,
		source,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TSX,
	);
	const edits = collectClassEdits(sourceFile);
	let output = source;
	for (const edit of edits.toSorted((a, b) => b.start - a.start)) {
		output = output.slice(0, edit.start) + edit.next + output.slice(edit.end);
	}
	writeFileSync(file, output);
}
