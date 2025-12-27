import {
	type FeatureExtractionPipeline,
	pipeline,
} from "@huggingface/transformers";
import { RAG_CONFIG } from "./config";

let embeddingPipeline: FeatureExtractionPipeline | null = null;

/**
 * Initialize the embedding model (lazy loading)
 */
async function getEmbeddingPipeline(): Promise<FeatureExtractionPipeline> {
	if (!embeddingPipeline) {
		console.log(`Loading embedding model: ${RAG_CONFIG.embedding.model}...`);
		embeddingPipeline = await pipeline(
			"feature-extraction",
			RAG_CONFIG.embedding.model,
			{ dtype: "fp32" },
		);
		console.log("Embedding model loaded successfully.");
	}
	return embeddingPipeline;
}

/**
 * Generate embedding for a single text
 * @param text - Input text to embed
 * @param isQuery - Whether this is a query (vs passage)
 * @returns Embedding vector
 */
export async function embed(text: string, isQuery = false): Promise<number[]> {
	const pipe = await getEmbeddingPipeline();

	// E5 models require prefixes
	const prefix = isQuery
		? RAG_CONFIG.embedding.prefix.query
		: RAG_CONFIG.embedding.prefix.passage;

	const prefixedText = prefix + text;

	const output = await pipe(prefixedText, {
		pooling: "mean",
		normalize: true,
	});

	// Convert to array
	return Array.from(output.data as Float32Array);
}

/**
 * Generate embeddings for multiple texts in batch
 * @param texts - Array of input texts
 * @param isQuery - Whether these are queries (vs passages)
 * @returns Array of embedding vectors
 */
export async function embedBatch(
	texts: string[],
	isQuery = false,
): Promise<number[][]> {
	const pipe = await getEmbeddingPipeline();

	const prefix = isQuery
		? RAG_CONFIG.embedding.prefix.query
		: RAG_CONFIG.embedding.prefix.passage;

	const prefixedTexts = texts.map((t) => prefix + t);

	const outputs = await pipe(prefixedTexts, {
		pooling: "mean",
		normalize: true,
	});

	// outputs.data is a flat Float32Array, need to reshape
	const embeddings: number[][] = [];
	const dim = RAG_CONFIG.qdrant.vectorSize;

	for (let i = 0; i < texts.length; i++) {
		const start = i * dim;
		const end = start + dim;
		embeddings.push(
			Array.from((outputs.data as Float32Array).slice(start, end)),
		);
	}

	return embeddings;
}

/**
 * Test the embedding functionality
 */
export async function testEmbedding(): Promise<void> {
	console.log("Testing embedding...");

	const testText = "これはテストです。";
	const embedding = await embed(testText, false);

	console.log(`Input: "${testText}"`);
	console.log(`Embedding dimension: ${embedding.length}`);
	console.log(
		`First 5 values: [${embedding
			.slice(0, 5)
			.map((v) => v.toFixed(4))
			.join(", ")}]`,
	);

	// Test similarity
	const query = "テスト";
	const queryEmbedding = await embed(query, true);

	const similarity = cosineSimilarity(queryEmbedding, embedding);
	console.log(`Query: "${query}"`);
	console.log(`Similarity: ${similarity.toFixed(4)}`);
}

function cosineSimilarity(a: number[], b: number[]): number {
	let dotProduct = 0;
	let normA = 0;
	let normB = 0;

	for (let i = 0; i < a.length; i++) {
		dotProduct += a[i] * b[i];
		normA += a[i] * a[i];
		normB += b[i] * b[i];
	}

	return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
