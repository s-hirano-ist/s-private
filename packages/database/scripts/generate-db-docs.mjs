import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const MERMAID_VERSION = "11.16.1";

function stripLineComment(line) {
	let quote;
	for (let index = 0; index < line.length - 1; index += 1) {
		const character = line[index];
		if ((character === '"' || character === "'") && line[index - 1] !== "\\") {
			quote = quote === character ? undefined : quote || character;
		}
		if (!quote && character === "/" && line[index + 1] === "/") {
			return line.slice(0, index);
		}
	}
	return line;
}

function extractModelBlocks(schema) {
	const blocks = [];
	let current = null;
	for (const sourceLine of schema.split("\n")) {
		const line = stripLineComment(sourceLine).trim();
		if (!current && line.startsWith("model ") && line.endsWith("{")) {
			const name = line.slice("model ".length, -1).trim();
			current = { lines: [], name };
			continue;
		}
		if (current && line === "}") {
			blocks.push(current);
			current = null;
			continue;
		}
		if (current) current.lines.push(line);
	}
	return blocks;
}

function extractRelationFields(attributes) {
	const markerIndex = attributes.indexOf("fields:");
	if (markerIndex === -1) return [];
	const start = attributes.indexOf("[", markerIndex);
	const end = attributes.indexOf("]", start);
	if (start === -1 || end === -1) return [];
	return attributes
		.slice(start + 1, end)
		.split(",")
		.map((relationField) => relationField.trim());
}

function extractRelationName(attributes) {
	const relationStart = attributes.indexOf('@relation("');
	if (relationStart === -1) return null;
	const valueStart = relationStart + '@relation("'.length;
	const valueEnd = attributes.indexOf('"', valueStart);
	return valueEnd === -1 ? null : attributes.slice(valueStart, valueEnd);
}

function parseField(line, modelNames) {
	const tokens = line.split(/\s+/u);
	if (tokens.length < 2 || line.startsWith("@@")) return null;
	const [name, rawType] = tokens;
	const isList = rawType.endsWith("[]");
	const isRequired = !rawType.endsWith("?");
	const type = rawType.replace(/\[\]$|\?$/u, "");
	const attributes = tokens.slice(2).join(" ");
	const attributeTokens = new Set(tokens.slice(2));
	return {
		isId: attributeTokens.has("@id"),
		isList,
		isRequired,
		isUnique: attributeTokens.has("@unique"),
		kind: modelNames.has(type) ? "object" : "value",
		name,
		relationFromFields: extractRelationFields(attributes),
		relationName: extractRelationName(attributes),
		type,
	};
}

export function parsePrismaSchema(schema) {
	const blocks = extractModelBlocks(schema);
	const modelNames = new Set(blocks.map((block) => block.name));
	return blocks.map((block) => ({
		fields: block.lines
			.map((line) => parseField(line, modelNames))
			.filter(Boolean),
		name: block.name,
	}));
}

function attributeType(field) {
	return field.isList ? `${field.type}_array` : field.type;
}

function relationLabel(field) {
	return (field.relationName || field.name).replaceAll('"', "'");
}

function renderEntity(model) {
	const foreignKeys = new Set(
		model.fields
			.filter((field) => field.kind === "object")
			.flatMap((field) => field.relationFromFields),
	);
	const lines = [`  ${model.name} {`];
	for (const valueField of model.fields.filter(
		(candidateField) => candidateField.kind !== "object",
	)) {
		const constraints = [
			valueField.isId ? "PK" : "",
			foreignKeys.has(valueField.name) ? "FK" : "",
			valueField.isUnique ? "UK" : "",
		].filter(Boolean);
		lines.push(
			`    ${attributeType(valueField)} ${valueField.name}${constraints.length > 0 ? ` ${constraints.join(",")}` : ""}`,
		);
	}
	lines.push("  }");
	return lines;
}

function relationCardinality(models, model, field) {
	const parent = models.find((candidate) => candidate.name === field.type);
	const inverse = parent?.fields.find(
		(candidate) =>
			candidate.kind === "object" &&
			candidate.type === model.name &&
			(!field.relationName || candidate.relationName === field.relationName),
	);
	if (inverse?.isList) return "o{";
	if (inverse?.isRequired) return "||";
	return "o|";
}

function renderRelations(models) {
	return models
		.flatMap((model) =>
			model.fields
				.filter(
					(field) =>
						field.kind === "object" && field.relationFromFields.length > 0,
				)
				.map((field) => ({ field, model })),
		)
		.toSorted((left, right) =>
			`${left.field.type}.${left.model.name}.${left.field.name}`.localeCompare(
				`${right.field.type}.${right.model.name}.${right.field.name}`,
			),
		)
		.map(({ field, model }) => {
			const parentCardinality = field.isRequired ? "||" : "o|";
			const childCardinality = relationCardinality(models, model, field);
			return `  ${field.type} ${parentCardinality}--${childCardinality} ${model.name} : "${relationLabel(field)}"`;
		});
}

export function renderMermaid(schema) {
	const models = parsePrismaSchema(schema).toSorted((left, right) =>
		left.name.localeCompare(right.name),
	);
	const lines = [
		"erDiagram",
		...models.flatMap((model) => renderEntity(model)),
		...renderRelations(models),
	];
	return `${lines.join("\n")}\n`;
}

export function renderMarkdown(mermaid) {
	return `# Database schema\n\n\`\`\`mermaid\n${mermaid}\`\`\`\n`;
}

function escapeHtml(value) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
}

export function renderHtml(mermaid) {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Database Schema - s-private</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #1a1a2e; color: #e0e0e0; min-height: 100vh; }
    header { background: #16213e; border-bottom: 1px solid #0f3460; padding: 1rem 2rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
    header h1 { font-size: 1.25rem; font-weight: 600; }
    nav { display: flex; gap: 1rem; }
    nav a { color: #53a8ff; text-decoration: none; font-size: 0.875rem; }
    nav a:hover { text-decoration: underline; }
    main { padding: 2rem; display: flex; flex-direction: column; align-items: center; }
    .diagram-container { width: 100%; max-width: 100%; overflow: auto; background: #fff; border-radius: 8px; padding: 1rem; }
    .diagram-container .mermaid { display: flex; justify-content: center; }
    footer { text-align: center; padding: 1rem; font-size: 0.75rem; color: #888; }
  </style>
</head>
<body>
  <header>
    <h1>Database Schema</h1>
    <nav><a href="../index.html">API Docs</a><a href="https://github.com/s-hirano-ist/s-private">GitHub</a></nav>
  </header>
  <main><div class="diagram-container"><pre class="mermaid">${escapeHtml(mermaid)}</pre></div></main>
  <footer>Auto-generated from Prisma schema</footer>
  <script type="module">
    import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@${MERMAID_VERSION}/dist/mermaid.esm.min.mjs";
    mermaid.initialize({ startOnLoad: true, theme: "default" });
  </script>
</body>
</html>
`;
}

export async function generateDatabaseDocs({ schema, packageRoot, repoRoot }) {
	const mermaid = renderMermaid(schema);
	const erdPath = resolve(packageRoot, "erd/schema.md");
	const htmlPath = resolve(repoRoot, "docs/api/database/index.html");

	await Promise.all([
		mkdir(dirname(erdPath), { recursive: true }),
		mkdir(dirname(htmlPath), { recursive: true }),
	]);
	await Promise.all([
		writeFile(erdPath, renderMarkdown(mermaid), "utf8"),
		writeFile(htmlPath, renderHtml(mermaid), "utf8"),
	]);

	return { erdPath, htmlPath };
}

async function main() {
	const packageRoot = resolve(import.meta.dirname, "..");
	const repoRoot = resolve(packageRoot, "../..");
	const schema = await readFile(
		resolve(packageRoot, "prisma/schema.prisma"),
		"utf8",
	);
	const outputs = await generateDatabaseDocs({ schema, packageRoot, repoRoot });
	console.log(`Database docs generated at ${outputs.htmlPath}`);
}

const entryPoint = process.argv[1]
	? pathToFileURL(resolve(process.argv[1])).href
	: undefined;
if (entryPoint === import.meta.url) {
	await main();
}
