import type { IImageProcessor } from "@s-hirano-ist/s-application/content/image-processor";
import type { MobileDomain } from "@s-hirano-ist/s-application/content/models";
import type { MobileDeps } from "@s-hirano-ist/s-application/mobile/deps";
import * as schemas from "@s-hirano-ist/s-api-contracts/schemas";
import {
	createArticle,
	deleteArticle,
	parseArticleInput,
	type CreateArticleDeps,
} from "@s-hirano-ist/s-application/articles/use-cases";
import { parseBookInput } from "@s-hirano-ist/s-application/books/input";
import {
	createBook,
	deleteBook,
	type CreateBookDeps,
} from "@s-hirano-ist/s-application/books/use-cases";
import { OperationPhaseError } from "@s-hirano-ist/s-application/diagnostics/operation-phase-error";
import { ApplicationError } from "@s-hirano-ist/s-application/error";
import { parseImageInput } from "@s-hirano-ist/s-application/images/input";
import {
	createImage,
	deleteImage,
	type CreateImageDeps,
} from "@s-hirano-ist/s-application/images/use-cases";
import {
	mobileInputHash,
	runMobileOperation,
} from "@s-hirano-ist/s-application/mobile/operations";
import {
	createNote,
	deleteNote,
	parseNoteInput,
	type CreateNoteDeps,
} from "@s-hirano-ist/s-application/notes/use-cases";
import {
	makeId,
	makeUserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { makePath } from "@s-hirano-ist/s-core/shared-kernel/entities/file-entity";
import {
	DuplicateError,
	FileNotAllowedError,
	InvalidFormatError,
} from "@s-hirano-ist/s-core/shared-kernel/errors/error-classes";
import { createHash } from "node:crypto";
import { ApiError } from "s-private-backend/api/error";
import { z, ZodError } from "zod";

export type MediaInput = z.output<typeof schemas.uploadStartSchema>;
export type WriteServiceDeps = {
	imageProcessor: IImageProcessor;
	articles: CreateArticleDeps;
	books: CreateBookDeps;
	images: CreateImageDeps;
	mobile: Pick<MobileDeps, "content" | "operations" | "errors">;
	notes: CreateNoteDeps;
};
function unwrap(error: unknown): unknown {
	return error instanceof OperationPhaseError ? unwrap(error.cause) : error;
}
function duplicate(error: unknown): boolean {
	const cause = unwrap(error);
	return (
		cause instanceof DuplicateError ||
		(cause instanceof ApplicationError && cause.code === "DUPLICATE")
	);
}
async function validateDomain<T>(work: () => Promise<T>): Promise<T> {
	try {
		return await work();
	} catch (error) {
		const cause = unwrap(error);
		if (
			cause instanceof ZodError ||
			cause instanceof InvalidFormatError ||
			cause instanceof FileNotAllowedError
		)
			throw new ApiError("VALIDATION_ERROR");
		throw error;
	}
}
export function createWriteService(deps: WriteServiceDeps) {
	const { mobile } = deps;
	async function run(
		owner: string,
		domain: MobileDomain,
		operationId: string,
		input: unknown,
		work: () => Promise<{ id: string }>,
		key: () => string,
	) {
		const existing = await mobile.operations.findOperation(operationId);
		return schemas.createResultSchema.parse(
			await runMobileOperation(
				owner,
				domain,
				operationId,
				input,
				async () => {
					try {
						return (await validateDomain(work)).id;
					} catch (error) {
						if (duplicate(error)) {
							if (
								domain === "images" &&
								existing?.userId === owner &&
								existing.status === "FAILED"
							) {
								const id = await mobile.content.lookupContentId(
									domain,
									owner,
									key(),
								);
								if (id) return id;
							}
							throw new ApiError("DUPLICATE");
						}
						throw error;
					}
				},
				mobile,
			),
		);
	}
	return {
		async article(
			owner: string,
			input: z.output<typeof schemas.articleCreateSchema>,
		) {
			const canonical = { ...input, quote: input.quote ?? "" };
			return run(
				owner,
				"articles",
				input.operationId,
				canonical,
				() =>
					createArticle(
						parseArticleInput(canonical, makeUserId(owner)),
						deps.articles,
					),
				() => input.url,
			);
		},
		async note(
			owner: string,
			input: z.output<typeof schemas.noteCreateSchema>,
		) {
			return run(
				owner,
				"notes",
				input.operationId,
				input,
				() => createNote(parseNoteInput(input, makeUserId(owner)), deps.notes),
				() => input.title,
			);
		},
		async media(
			owner: string,
			input: MediaInput,
			file: File,
			legacyMetadata?: Record<string, string>,
		) {
			const fileHash = createHash("sha256")
				.update(Buffer.from(await file.arrayBuffer()))
				.digest("hex");
			const modern = {
				version: 1,
				operationId: input.operationId,
				metadata: input.metadata,
				contentType: input.contentType,
				fileHash,
			};
			let hashInput: unknown = modern;
			const existing = await mobile.operations.findOperation(input.operationId);
			const oldImage = {
				operationId: input.operationId,
				fileHash,
				contentType: input.contentType,
			};
			let legacyInput: unknown = oldImage;
			if (input.domain === "books") {
				const { isbn, title, rating, tags } = input.metadata;
				legacyInput = {
					...(legacyMetadata ?? {
						isbn,
						title,
						rating: String(rating),
						tags: tags.join(","),
					}),
					operationId: input.operationId,
					fileHash,
				};
			}
			const representable =
				input.domain === "images" ||
				!input.metadata.tags.some((tag) => tag.includes(","));
			const matchesLegacy =
				existing?.userId === owner &&
				existing.domain === input.domain &&
				representable &&
				existing.inputHash === mobileInputHash(legacyInput);
			if (matchesLegacy) {
				hashInput = legacyInput;
				// Old failed image operations have no durable file hash/path association. Never guess the latest image.
				if (input.domain === "images" && existing.status === "FAILED")
					throw new ApiError("OPERATION_CONFLICT");
			}
			let storedPath = "";
			return run(
				owner,
				input.domain,
				input.operationId,
				hashInput,
				async () => {
					const phase = {
						action: input.domain === "images" ? "addImage" : "addBooks",
						fileName: file.name,
						fileSize: file.size,
						contentType: file.type,
					};
					if (input.domain === "images") {
						const parsed = await parseImageInput(
							file,
							makeUserId(owner),
							deps.imageProcessor,
						);
						const extension = parsed.contentType.split("/").at(-1) ?? "jpeg";
						const path = makePath(`${input.operationId}.${extension}`, false);
						storedPath = path;
						return createImage({ ...parsed, path }, deps.images, phase);
					}
					const parsed = await parseBookInput(
						{ ...input.metadata, image: file },
						makeUserId(owner),
						deps.imageProcessor,
					);
					const extension = parsed.contentType.split("/").at(-1) ?? "jpeg";
					const path = makePath(`${input.operationId}.${extension}`, false);
					return createBook(
						{ ...parsed, path, imagePath: path },
						deps.books,
						phase,
					);
				},
				() => (input.domain === "books" ? input.metadata.isbn : storedPath),
			);
		},
		async remove(owner: string, domain: MobileDomain, id: string) {
			const record = await mobile.content.getContent(domain, owner, id);
			if (!record) throw new ApiError("NOT_FOUND");
			if (
				z.object({ status: schemas.statusSchema }).parse(record).status !==
				"UNEXPORTED"
			)
				throw new ApiError("NOT_DELETABLE");
			const ownerId = makeUserId(owner);
			const resourceId = makeId(id);
			try {
				switch (domain) {
					case "articles":
						await deleteArticle(resourceId, ownerId, deps.articles);
						break;
					case "notes":
						await deleteNote(resourceId, ownerId, deps.notes);
						break;
					case "images":
						await deleteImage(resourceId, ownerId, deps.images);
						break;
					case "books":
						await deleteBook(resourceId, ownerId, deps.books);
						break;
				}
			} catch (error) {
				if (mobile.errors.isRecordNotFoundError(error))
					throw new ApiError("NOT_FOUND");
				throw error;
			}
		},
	};
}
export type WriteService = ReturnType<typeof createWriteService>;
