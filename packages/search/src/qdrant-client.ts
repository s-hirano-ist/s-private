import { QdrantClient } from "@qdrant/js-client-rest";
import {
	type ContentType,
	type QdrantPayload,
	RAG_CONFIG,
	type SearchResult,
} from "./config.ts";

let client: QdrantClient | null = null;

/**
 * Get or create Qdrant client
 */
export function getQdrantClient(config?: {
	url?: string;
	apiKey?: string;
}): QdrantClient {
	if (!client) {
		const url = config?.url ?? process.env.QDRANT_URL;
		const apiKey = config?.apiKey ?? process.env.QDRANT_API_KEY;

		if (!url) {
			throw new Error("QDRANT_URL environment variable is required");
		}

		client = new QdrantClient({
			url,
			apiKey,
		});
	}

	return client;
}

/**
 * Delete a collection by name
 */
export async function deleteCollection(collectionName: string): Promise<void> {
	const qdrant = getQdrantClient();
	await qdrant.deleteCollection(collectionName);
}

/**
 * Create collection if not exists
 */
export async function ensureCollection(): Promise<void> {
	const qdrant = getQdrantClient();
	const { collectionName, vectorSize, distance } = RAG_CONFIG.qdrant;

	const collections = await qdrant.getCollections();
	const exists = collections.collections.some((c) => c.name === collectionName);

	if (!exists) {
		console.log(`Creating collection: ${collectionName}`);
		await qdrant.createCollection(collectionName, {
			vectors: {
				size: vectorSize,
				distance,
			},
		});
		console.log(`Collection ${collectionName} created successfully.`);
	} else {
		console.log(`Collection ${collectionName} already exists.`);
	}

	// Ensure payload indexes exist for filterable fields
	// createPayloadIndex is idempotent — safe to call on existing collections
	await qdrant.createPayloadIndex(collectionName, {
		field_name: "type",
		field_schema: "keyword",
		wait: true,
	});
	await qdrant.createPayloadIndex(collectionName, {
		field_name: "top_heading",
		field_schema: "keyword",
		wait: true,
	});
	await qdrant.createPayloadIndex(collectionName, {
		field_name: "content_type",
		field_schema: "keyword",
		wait: true,
	});
	console.log("Payload indexes ensured for: type, top_heading, content_type");
}

/**
 * Upsert points to Qdrant
 */
export async function upsertPoints(
	points: { id: string; vector: number[]; payload: QdrantPayload }[],
): Promise<void> {
	const qdrant = getQdrantClient();
	const { collectionName } = RAG_CONFIG.qdrant;

	// Qdrant requires numeric or UUID IDs, so we hash the chunk_id
	const qdrantPoints = points.map((p) => ({
		id: hashToUint(p.id),
		vector: p.vector,
		payload: p.payload,
	}));

	await qdrant.upsert(collectionName, {
		wait: true,
		points: qdrantPoints,
	});
}

/**
 * Get existing content hashes for a set of chunk IDs
 */
export async function getExistingHashes(
	chunkIds: string[],
): Promise<Map<string, string>> {
	const qdrant = getQdrantClient();
	const { collectionName } = RAG_CONFIG.qdrant;

	const hashMap = new Map<string, string>();

	if (chunkIds.length === 0) return hashMap;

	// Convert chunk IDs to numeric IDs
	const numericIds = chunkIds.map((id) => hashToUint(id));

	try {
		const result = await qdrant.retrieve(collectionName, {
			ids: numericIds,
			with_payload: ["chunk_id", "content_hash"],
		});

		for (const point of result) {
			const payload = point.payload as QdrantPayload;
			if (payload?.chunk_id && payload?.content_hash) {
				hashMap.set(payload.chunk_id, payload.content_hash);
			}
		}
	} catch {
		// Collection might not exist or be empty
	}

	return hashMap;
}

/**
 * Search for similar documents
 */
export async function search(
	queryVector: number[],
	options: {
		topK?: number;
		filter?: {
			type?: "markdown_note" | "bookmark_json";
			top_heading?: string;
			content_type?: ContentType | ContentType[];
		};
	} = {},
): Promise<SearchResult[]> {
	const qdrant = getQdrantClient();
	const { collectionName } = RAG_CONFIG.qdrant;
	const { topK = 10, filter } = options;

	// Build filter conditions
	const filterConditions: Array<{
		key: string;
		match: { value: string } | { any: string[] };
	}> = [];

	if (filter?.type) {
		filterConditions.push({
			key: "type",
			match: { value: filter.type },
		});
	}

	if (filter?.top_heading) {
		filterConditions.push({
			key: "top_heading",
			match: { value: filter.top_heading },
		});
	}

	if (filter?.content_type) {
		if (Array.isArray(filter.content_type)) {
			filterConditions.push({
				key: "content_type",
				match: { any: filter.content_type },
			});
		} else {
			filterConditions.push({
				key: "content_type",
				match: { value: filter.content_type },
			});
		}
	}

	const result = await qdrant.search(collectionName, {
		vector: queryVector,
		limit: topK,
		with_payload: true,
		filter:
			filterConditions.length > 0 ? { must: filterConditions } : undefined,
	});

	return result.map((r) => {
		const payload = r.payload as QdrantPayload;
		return {
			score: r.score,
			text: payload.text,
			title: payload.title,
			url: payload.url,
			heading_path: payload.heading_path,
			type: payload.type,
			content_type: payload.content_type,
			doc_id: payload.doc_id,
		};
	});
}

/**
 * Get collection stats
 */
export async function getCollectionStats(): Promise<{
	pointsCount: number;
	status: string;
}> {
	const qdrant = getQdrantClient();
	const { collectionName } = RAG_CONFIG.qdrant;

	try {
		const info = await qdrant.getCollection(collectionName);
		return {
			pointsCount: info.points_count ?? 0,
			status: info.status,
		};
	} catch {
		return {
			pointsCount: 0,
			status: "not_found",
		};
	}
}

/**
 * Hash string to unsigned integer (for Qdrant point ID)
 */
function hashToUint(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return Math.abs(hash);
}
