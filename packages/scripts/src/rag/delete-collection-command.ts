import {
	deleteCollection,
	getQdrantClient,
} from "@s-hirano-ist/s-search/qdrant-client";

export async function main() {
	const collectionName = process.argv[2];

	if (!collectionName) {
		console.error(
			"Usage: rag-delete-collection <collection-name>\nExample: rag-delete-collection knowledge_v1",
		);
		process.exitCode = 1;
		return;
	}

	if (!process.env.QDRANT_URL) {
		throw new Error("QDRANT_URL environment variable is required.");
	}

	const qdrant = getQdrantClient();
	const collections = await qdrant.getCollections();
	const exists = collections.collections.some((c) => c.name === collectionName);

	if (!exists) {
		console.log(
			`Collection "${collectionName}" does not exist. Nothing to delete.`,
		);
		return;
	}

	console.log(`Deleting collection "${collectionName}"...`);
	await deleteCollection(collectionName);
	console.log(`Collection "${collectionName}" deleted successfully.`);
}
