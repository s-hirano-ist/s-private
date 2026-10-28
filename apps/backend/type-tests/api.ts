import { noteSchema } from "@s-hirano-ist/s-api-contracts/schemas";
import { registerContentDomain } from "s-private-backend/api/content-routes";
import { ApiError } from "s-private-backend/api/error";
// Compiled by the backend typecheck, never executed.
export function verifyInvalidCode() {
	// @ts-expect-error only contract error codes may be constructed.
	return new ApiError("UNKNOWN");
}
export function verifyInvalidStatus() {
	// @ts-expect-error status is derived from the code, never supplied by callers.
	return new ApiError("NOT_FOUND", 401);
}

export async function verifyReadModels(
	content: import("@s-hirano-ist/s-application/mobile/ports").MobileContentRepository,
	reads: import("s-private-backend/api/read-service").ReadService,
) {
	const article = await content.getContent("articles", "owner", "id");
	if (article) {
		const createdAt: Date = article.createdAt;
		// @ts-expect-error an article cannot widen to a note.
		void article.markdown;
		void createdAt;
	}
	const note = await reads.detail("notes", "owner", "id");
	const createdAt: string = note.createdAt;
	// @ts-expect-error note DTOs have no article URL.
	void note.url;
	const book = await reads.lookup("books", "owner", "9780306406157");
	// @ts-expect-error book DTOs have no article category.
	void book.categoryId;
	void createdAt;
}

export function verifyRouteBinding(
	app: import("s-private-backend/api/types").ApiApp,
	reads: import("s-private-backend/api/read-service").ReadService,
	writes: import("s-private-backend/api/write-service").WriteService,
) {
	// @ts-expect-error the article routes cannot bind a note response schema.
	registerContentDomain(app, "articles", noteSchema, reads, writes);
}
