import type { SearchIndex } from "@s-hirano-ist/s-application/content/queries";
import type { createVectorSearch } from "@s-hirano-ist/s-infrastructure/search/vector-search";
export function createSearchIndex(
	searchVectors: ReturnType<typeof createVectorSearch>,
): SearchIndex {
	return {
		async search(query, limit) {
			const { results } = await searchVectors(query, { topK: limit });
			return results.map((hit) => {
				let key = hit.url ?? "";
				if (hit.content_type === "books")
					key = /\/book\/([^/]+)\.md$/u.exec(hit.doc_id)?.[1] ?? "";
				else if (hit.content_type === "notes")
					key = hit.heading_path[0] ?? hit.title;
				return { type: hit.content_type, key };
			});
		},
	};
}
