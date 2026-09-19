const qdrantUrl = process.env.QDRANT_URL;
const collectionName = process.env.QDRANT_COLLECTION_NAME;
const vectorSize = Number(process.env.EMBEDDING_VECTOR_SIZE);

if (!qdrantUrl || !collectionName || !Number.isInteger(vectorSize)) {
	throw new Error("Local Qdrant configuration is incomplete");
}

async function request(path, init) {
	const response = await fetch(`${qdrantUrl}${path}`, init);
	if (!response.ok) {
		throw new Error(
			`Qdrant initialization failed (${response.status}): ${await response.text()}`,
		);
	}
	return response;
}

const collections = await request("/collections").then((response) =>
	response.json(),
);
const exists = collections.result.collections.some(
	(collection) => collection.name === collectionName,
);

if (!exists) {
	await request(`/collections/${collectionName}`, {
		method: "PUT",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			vectors: { size: vectorSize, distance: "Cosine" },
		}),
	});
}

for (const fieldName of ["type", "top_heading", "content_type"]) {
	await request(`/collections/${collectionName}/index`, {
		method: "PUT",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ field_name: fieldName, field_schema: "keyword" }),
	});
}

console.log(`Local Qdrant collection ready: ${collectionName}`);
