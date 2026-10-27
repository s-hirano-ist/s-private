import type { ReadQueriesDeps } from "@s-hirano-ist/s-application/content/queries";
import { createReadQueries } from "@s-hirano-ist/s-application/content/queries";
import { expect, test, vi } from "vitest";

test("search preserves index order, removes duplicate resources and omits foreign candidates", async () => {
	const candidates = [
		{ type: "notes", key: "b" },
		{ type: "notes", key: "foreign" },
		{ type: "notes", key: "a" },
		{ type: "notes", key: "b" },
	] as const;
	const resolve = vi.fn().mockResolvedValue([
		{
			key: "a",
			hit: { id: "a", type: "notes", title: "A", snippet: "owned A" },
		},
		{
			key: "b",
			hit: { id: "b", type: "notes", title: "B", snippet: "owned B" },
		},
	]);
	const search = vi.fn().mockResolvedValue(candidates);
	const service = createReadQueries({
		query: { resolve },
		search: { search },
	} as unknown as ReadQueriesDeps);
	expect(await service.search("owner", { query: "term", limit: 10 })).toEqual({
		query: "term",
		data: [
			{ id: "b", type: "notes", title: "B", snippet: "owned B" },
			{ id: "a", type: "notes", title: "A", snippet: "owned A" },
		],
	});
	expect(resolve).toHaveBeenCalledWith("owner", candidates);
	expect(search).toHaveBeenCalledWith("term", 10);
});
