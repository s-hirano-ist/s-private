import { homedir } from "node:os";
import { join } from "node:path";
import {
	env,
	type FeatureExtractionPipeline,
	pipeline as transformersPipeline,
} from "@huggingface/transformers";
import { RAG_CONFIG } from "./config.js";

const CACHE_DIR = join(homedir(), ".cache", "huggingface", "transformers");

env.cacheDir = CACHE_DIR;
env.localModelPath = CACHE_DIR;
env.useFSCache = true;
env.useBrowserCache = false;
env.useCustomCache = false;
env.allowRemoteModels = true;

let embeddingPipeline: FeatureExtractionPipeline | null = null;

/**
 * Initialize the embedding model (lazy loading)
 */
async function getEmbeddingPipeline(): Promise<FeatureExtractionPipeline> {
	if (!embeddingPipeline) {
		console.log(`Loading embedding model: ${RAG_CONFIG.embedding.model}...`);
		console.log(`Cache directory: ${CACHE_DIR}`);
		embeddingPipeline = (await transformersPipeline(
			"feature-extraction",
			RAG_CONFIG.embedding.model,
			{ dtype: "fp32", use_external_data_format: true },
		)) as unknown as FeatureExtractionPipeline;
		console.log("Embedding model loaded successfully.");
	}
	return embeddingPipeline;
}

/**
 * Eagerly initialize the embedding pipeline (call at server startup)
 */
export async function initEmbeddingPipeline(): Promise<void> {
	const MAX_RETRIES = 3;
	for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
		try {
			await getEmbeddingPipeline();
			return;
		} catch (error) {
			if (attempt === MAX_RETRIES) throw error;
			const delay = attempt * 5000;
			console.warn(
				`Model loading attempt ${attempt}/${MAX_RETRIES} failed, retrying in ${delay}ms...`,
				error,
			);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}
}

/**
 * Check if the embedding pipeline is ready
 */
export function isEmbeddingReady(): boolean {
	return embeddingPipeline !== null;
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
