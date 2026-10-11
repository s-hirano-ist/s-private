import { env } from "@/env";
import { createVectorSearch } from "@s-hirano-ist/s-backend/search/vector-search";
export const searchVectors = createVectorSearch({
	url: env.QDRANT_URL,
	apiKey: env.QDRANT_API_KEY,
});
