import type {
	MobileOperation,
	MobileOperationRepository,
} from "s-private-backend/mobile/ports";
import { DuplicateError } from "@s-hirano-ist/s-core/shared-kernel/errors/error-classes";
import { createHash } from "node:crypto";
import {
	createWriteService,
	type WriteServiceDeps,
	type MediaInput,
} from "s-private-backend/api/write-service";
import { createBook } from "s-private-backend/books/use-cases";
import { createImage } from "s-private-backend/images/use-cases";
import { mobileInputHash } from "s-private-backend/mobile/operations";
import { createNote } from "s-private-backend/notes/use-cases";
import { describe, expect, test, vi } from "vitest";
vi.mock("s-private-backend/books/use-cases", () => ({
	createBook: vi.fn(),
	deleteBook: vi.fn(),
}));
vi.mock("s-private-backend/images/input", () => ({
	parseImageInput: vi.fn(async () => ({ contentType: "image/png" })),
}));
vi.mock("s-private-backend/images/use-cases", () => ({
	createImage: vi.fn(),
	deleteImage: vi.fn(),
}));
vi.mock("s-private-backend/notes/use-cases", () => ({
	parseNoteInput: vi.fn((input) => input),
	createNote: vi.fn(),
	deleteNote: vi.fn(),
}));
const operationId = "0199cb00-0000-7000-8000-000000000001";
function fixture() {
	let operation: MobileOperation | null = null;
	const operations: MobileOperationRepository = {
		findOperation: vi.fn(async () => (operation ? { ...operation } : null)),
		createOperation: vi.fn(async (_id, userId, domain, inputHash) => {
			operation = {
				userId,
				domain,
				inputHash,
				status: "PENDING",
				resourceId: null,
			};
		}),
		markOperationPending: vi.fn(async () => {
			if (operation) operation.status = "PENDING";
		}),
		markOperationFailed: vi.fn(async () => {
			if (operation) operation.status = "FAILED";
		}),
		markOperationSucceeded: vi.fn(async (_id, resourceId) => {
			if (operation) {
				operation.status = "SUCCEEDED";
				operation.resourceId = resourceId;
			}
		}),
	};
	const lookupContentId = vi.fn(async () => "recovered-image");
	const deps = {
		articles: {},
		notes: {},
		images: {},
		books: {},
		mobile: {
			operations,
			content: { lookupContentId },
			errors: { isRecordNotFoundError: () => false },
		},
	} as unknown as WriteServiceDeps;
	return {
		service: createWriteService(deps),
		operations,
		lookupContentId,
		setOperation(value: MobileOperation) {
			operation = value;
		},
	};
}
describe("Shared API operation replay", () => {
	test("returns the durable result without creating twice, rejects changed input and foreign owner", async () => {
		const { service } = fixture();
		const input = { operationId, title: "Note", markdown: "Body" };
		vi.mocked(createNote).mockResolvedValue({ id: "note" });
		const before = vi.mocked(createNote).mock.calls.length;
		expect(await service.note("owner", input)).toEqual(
			await service.note("owner", input),
		);
		expect(vi.mocked(createNote).mock.calls.length - before).toBe(1);
		await expect(
			service.note("owner", { ...input, markdown: "changed" }),
		).rejects.toMatchObject({ code: "OPERATION_CONFLICT" });
		await expect(service.note("foreign", input)).rejects.toMatchObject({
			code: "NOT_FOUND",
		});
	});
	test("uses a stable detected image path when retrying a failed operation", async () => {
		const { service, lookupContentId } = fixture();
		const input: MediaInput = {
			operationId,
			domain: "images",
			contentType: "image/jpeg",
			fileSize: 3,
			metadata: { filename: "photo.jpg" },
		};
		const file = new File(["png"], "photo.jpg", { type: "image/jpeg" });
		vi.mocked(createImage)
			.mockRejectedValueOnce(new Error("event failed"))
			.mockRejectedValueOnce(new DuplicateError("exists"));
		await expect(service.media("owner", input, file)).rejects.toThrow(
			"event failed",
		);
		const result = await service.media("owner", input, file);
		expect(result.resource.id).toBe("recovered-image");
		expect(lookupContentId).toHaveBeenCalledWith(
			"images",
			"owner",
			`${operationId}.png`,
		);
	});
	test("replays legacy successful images but refuses to guess a resource for legacy failures", async () => {
		const { service, setOperation, lookupContentId } = fixture();
		const file = new File(["png"], "photo.png", { type: "image/png" });
		const input: MediaInput = {
			operationId,
			domain: "images",
			contentType: "image/png",
			fileSize: 3,
			metadata: { filename: "photo.png" },
		};
		const old = {
			userId: "owner",
			domain: "images",
			inputHash: mobileInputHash({
				operationId,
				contentType: "image/png",
				fileHash: createHash("sha256").update("png").digest("hex"),
			}),
			status: "SUCCEEDED" as const,
			resourceId: "old-image",
		};
		setOperation(old);
		expect((await service.media("owner", input, file)).resource.id).toBe(
			"old-image",
		);
		setOperation({ ...old, status: "FAILED", resourceId: null });
		await expect(service.media("owner", input, file)).rejects.toMatchObject({
			code: "OPERATION_CONFLICT",
		});
		expect(lookupContentId).not.toHaveBeenCalled();
	});
	test("does not turn a repeated natural-key duplicate into another operation's success", async () => {
		const { service, lookupContentId } = fixture();
		const input = { operationId, title: "Duplicate", markdown: "Body" };
		vi.mocked(createNote).mockRejectedValue(new DuplicateError("exists"));
		await expect(service.note("owner", input)).rejects.toMatchObject({
			code: "DUPLICATE",
		});
		await expect(service.note("owner", input)).rejects.toMatchObject({
			code: "DUPLICATE",
		});
		expect(lookupContentId).not.toHaveBeenCalled();
	});
});

test("replays a completed legacy book after its upload row was removed, preserving raw CSV hash input", async () => {
	const { service, setOperation, lookupContentId } = fixture();
	const metadata = {
		isbn: "9781234567890",
		title: "Book",
		rating: "3",
		tags: " a , b, ",
	};
	const file = new File(["png"], "upload.jpg", { type: "image/jpeg" });
	setOperation({
		userId: "owner",
		domain: "books",
		status: "SUCCEEDED",
		resourceId: "old-book",
		inputHash: mobileInputHash({
			...metadata,
			operationId,
			fileHash: createHash("sha256").update("png").digest("hex"),
		}),
	});
	const input: MediaInput = {
		operationId,
		domain: "books",
		contentType: "image/jpeg",
		fileSize: 3,
		metadata: { ...metadata, rating: 3, tags: metadata.tags.split(",") },
	};
	expect((await service.media("owner", input, file)).resource.id).toBe(
		"old-book",
	);
	expect(createBook).not.toHaveBeenCalled();
	expect(lookupContentId).not.toHaveBeenCalled();
	await expect(
		service.media(
			"owner",
			{ ...input, metadata: { ...input.metadata, title: "Changed" } },
			file,
		),
	).rejects.toMatchObject({ code: "OPERATION_CONFLICT" });
});
