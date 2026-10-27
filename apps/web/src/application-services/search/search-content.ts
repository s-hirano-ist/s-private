import type {
	SearchContentParams,
	SearchHit,
} from "@s-hirano-ist/s-api-client/models";
import { getBackendClient } from "@/common/backend/server-client";

function toSearchResult(hit: SearchHit) {
	const common = { title: hit.title, snippet: hit.snippet };
	switch (hit.type) {
		case "articles":
			return {
				...common,
				contentType: hit.type,
				href: hit.url,
				url: hit.url,
				category: hit.category,
			};
		case "books":
			return {
				...common,
				contentType: hit.type,
				href: encodeURIComponent(hit.isbn),
				rating: hit.rating,
				tags: hit.tags,
			};
		case "notes":
			return {
				...common,
				contentType: hit.type,
				href: encodeURIComponent(hit.title),
			};
	}
	throw new Error("Unsupported search hit");
}

export async function searchContent(query: SearchContentParams) {
	const { data } = await (await getBackendClient()).searchContent(query);
	return { query: data.query, results: data.data.map(toSearchResult) };
}
