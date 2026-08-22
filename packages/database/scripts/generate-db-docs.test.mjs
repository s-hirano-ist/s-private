import { describe, expect, test } from "vitest";
import {
	parsePrismaSchema,
	renderHtml,
	renderMarkdown,
	renderMermaid,
} from "./generate-db-docs.mjs";

const schema = `
model Child {
  id       String @id
  parentId String
  Parent   Parent @relation(fields: [parentId], references: [id])
  aliases  String[]
}

model Parent {
  id       String  @id
  Children Child[]
}
`;

describe("database docs renderer", () => {
	test("parses Prisma field modifiers and relations", () => {
		const models = parsePrismaSchema(schema);

		expect(models).toHaveLength(2);
		expect(
			models[0].fields.find((field) => field.name === "aliases")?.isList,
		).toBe(true);
	});

	test("renders stable entities, keys, and relation cardinality", () => {
		const result = renderMermaid(schema);

		expect(result).toContain("String id PK");
		expect(result).toContain("String parentId FK");
		expect(result).toContain("String_array aliases");
		expect(result).toContain('Parent ||--o{ Child : "Parent"');
		expect(renderMermaid(schema)).toBe(result);
	});

	test("wraps Mermaid and pins the browser renderer", () => {
		const mermaid = renderMermaid(schema);

		expect(renderMarkdown(mermaid)).toContain("```mermaid");
		expect(renderHtml(mermaid)).toContain("mermaid@11.16.1/");
	});
});
