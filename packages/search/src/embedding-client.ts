export type EmbeddingClientConfig = {
	apiUrl: string;
	apiKey: string;
};

export function createEmbeddingClient(config: EmbeddingClientConfig) {
	const { apiUrl, apiKey } = config;

	return {
		async embed(text: string, isQuery?: boolean): Promise<number[]> {
			const response = await fetch(`${apiUrl}/embed`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify({ text, isQuery: isQuery ?? false }),
			});

			if (!response.ok) {
				throw new Error(
					`Embedding API returned ${response.status}: ${await response.text()}`,
				);
			}

			const data = (await response.json()) as { vector: number[] };
			return data.vector;
		},

		async embedBatch(texts: string[], isQuery?: boolean): Promise<number[][]> {
			const response = await fetch(`${apiUrl}/embed-batch`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify({ texts, isQuery: isQuery ?? false }),
			});

			if (!response.ok) {
				throw new Error(
					`Embedding API returned ${response.status}: ${await response.text()}`,
				);
			}

			const data = (await response.json()) as { vectors: number[][] };
			return data.vectors;
		},
	};
}
