import type { createBackendClient } from "@s-hirano-ist/s-api-client";

// Compiled by typecheck; never executed.
export async function verifyContractTypes(
	client: ReturnType<typeof createBackendClient>,
) {
	const articles = await client.listArticles();
	const url: string = articles.data.data[0].url;
	// @ts-expect-error article responses must not widen to the note DTO.
	void articles.data.data[0].markdown;
	const noteInput = { operationId: "id", title: "Title", markdown: "Body" };
	// @ts-expect-error articles require URL and category, not a note request.
	await client.createArticles(noteInput);
	// @ts-expect-error status must be a known content status.
	await client.listArticles({ status: "UNKNOWN" });
	// @ts-expect-error wire query parameters cannot contain null.
	await client.listArticles({ offset: null });
	// @ts-expect-error chunk path parameters cannot contain null.
	await client.putUploadChunk("upload-id", null, new Blob());
	const snapshot = await client.listSyncSnapshot({ domain: "categories" });
	for (const item of snapshot.data.data) {
		if (item.domain === "categories") {
			const name: string = item.record.name;
			// @ts-expect-error categories must not widen to content records.
			void item.record.title;
			void name;
		}
	}
	void url;
}

export async function verifyUploadTypes(
	client: ReturnType<typeof createBackendClient>,
) {
	// @ts-expect-error book uploads require ISBN, title, rating and tags.
	await client.startUpload({
		operationId: "id",
		domain: "books",
		contentType: "image/jpeg",
		fileSize: 100,
		metadata: { filename: "cover.jpg" },
	});
	await client.startUpload({
		operationId: "id",
		domain: "images",
		// @ts-expect-error only supported image MIME types are accepted.
		contentType: "text/plain",
		fileSize: 100,
		metadata: { filename: "cover.jpg" },
	});
}
