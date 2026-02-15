import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import {
	env,
	type FeatureExtractionPipeline,
	pipeline,
} from "@huggingface/transformers";
import { RAG_CONFIG } from "./config.ts";

const CACHE_DIR = join(homedir(), ".cache", "huggingface", "transformers");

// Disable built-in FileCache (broken with XET storage + return_path=true)
// Use custom cache instead for reliable caching
env.useFSCache = false;
env.useBrowserCache = false;
env.useCustomCache = true;
env.allowRemoteModels = true;
env.customCache = {
	async match(request: string) {
		const key = request.replace(/^https?:\/\//, "");
		const filePath = join(CACHE_DIR, key);
		if (existsSync(filePath)) {
			return new Response(readFileSync(filePath));
		}
		return undefined;
	},
	async put(request: string, response: Response) {
		const key = request.replace(/^https?:\/\//, "");
		const filePath = join(CACHE_DIR, key);
		await mkdir(dirname(filePath), { recursive: true });
		const buffer = Buffer.from(await response.arrayBuffer());
		await writeFile(filePath, buffer);
	},
};

let embeddingPipeline: FeatureExtractionPipeline | null = null;

/**
 * Initialize the embedding model (lazy loading)
 */
async function getEmbeddingPipeline(): Promise<FeatureExtractionPipeline> {
	if (!embeddingPipeline) {
		console.log(`Loading embedding model: ${RAG_CONFIG.embedding.model}...`);
		console.log(`Cache directory: ${CACHE_DIR}`);
		embeddingPipeline = (await pipeline(
			"feature-extraction",
			RAG_CONFIG.embedding.model,
			{ dtype: "fp32" },
		)) as unknown as FeatureExtractionPipeline;
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
