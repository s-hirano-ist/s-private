import { RAG_CONFIG } from "./config.ts";

export type EmbeddingClientConfig = {
	apiUrl: string;
	cfAccessClientId: string;
	cfAccessClientSecret: string;
};

export function createEmbeddingClient(config: EmbeddingClientConfig) {
	const { apiUrl, cfAccessClientId, cfAccessClientSecret } = config;

	function buildHeaders(): Record<string, string> {
		return {
			"Content-Type": "application/json",
			"CF-Access-Client-Id": cfAccessClientId,
			"CF-Access-Client-Secret": cfAccessClientSecret,
		};
	}

	return {
		async embed(text: string, isQuery?: boolean): Promise<number[]> {
			const prefix = isQuery
				? RAG_CONFIG.embedding.prefix.query
				: RAG_CONFIG.embedding.prefix.passage;

			const response = await fetch(`${apiUrl}/embed`, {
				method: "POST",
				headers: buildHeaders(),
				body: JSON.stringify({
					inputs: prefix + text,
					normalize: true,
					truncate: true,
				}),
				signal: AbortSignal.timeout(30_000),
			});

			if (!response.ok) {
				throw new Error(
					`Embedding API returned ${response.status}: ${await response.text()}`,
				);
			}

			const data = (await response.json()) as number[][];
			return data[0];
		},

		async embedBatch(texts: string[], isQuery?: boolean): Promise<number[][]> {
			const prefix = isQuery
				? RAG_CONFIG.embedding.prefix.query
				: RAG_CONFIG.embedding.prefix.passage;

			const inputs = texts.map((t) => prefix + t);

			const response = await fetch(`${apiUrl}/embed`, {
				method: "POST",
				headers: buildHeaders(),
				body: JSON.stringify({ inputs, normalize: true, truncate: true }),
				signal: AbortSignal.timeout(60_000),
			});

			if (!response.ok) {
				throw new Error(
					`Embedding API returned ${response.status}: ${await response.text()}`,
				);
			}

			return (await response.json()) as number[][];
		},
	};
}
