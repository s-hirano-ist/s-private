import type {
	MobileOperation,
	MobileOperationRepository,
} from "@s-hirano-ist/s-application/mobile/ports";
import { ApplicationError } from "@s-hirano-ist/s-application/error";
import { createImage } from "@s-hirano-ist/s-application/images/use-cases";
import { mobileInputHash } from "@s-hirano-ist/s-application/mobile/operations";
import { createNote } from "@s-hirano-ist/s-application/notes/use-cases";
import { DuplicateError } from "@s-hirano-ist/s-core/shared-kernel/errors/error-classes";
import { createHash } from "node:crypto";
import {
	createWriteService,
	type WriteServiceDeps,
	type MediaInput,
} from "s-private-backend/api/write-service";
import { describe, expect, test, vi } from "vitest";
vi.mock("@s-hirano-ist/s-application/books/use-cases", () => ({
	createBook: vi.fn(),
	deleteBook: vi.fn(),
}));
vi.mock("@s-hirano-ist/s-application/images/input", () => ({
	parseImageInput: vi.fn(async () => ({ contentType: "image/png" })),
}));
vi.mock("@s-hirano-ist/s-application/images/use-cases", () => ({
	createImage: vi.fn(),
	deleteImage: vi.fn(),
}));
vi.mock("@s-hirano-ist/s-application/notes/use-cases", () => ({
	parseNoteInput: vi.fn((input) => input),
	createNote: vi.fn(),
	deleteNote: vi.fn(),
}));
const operationId = "0199cb00-0000-7000-8000-000000000001";
function fixture() {
	let operation: MobileOperation | null = null;
	const operations: MobileOperationRepository = {
		findOperation: vi.fn(async () => (operation ? { ...operation } : null)),
		claimOperation: vi.fn(async (_id, userId, domain, inputHash) => {
			if (operation) {
				if (operation.userId !== userId)
					throw new ApplicationError("NOT_FOUND");
				if (operation.domain !== domain || operation.inputHash !== inputHash)
					throw new ApplicationError("OPERATION_CONFLICT");
				if (operation.status === "SUCCEEDED" && operation.resourceId)
					return { resourceId: operation.resourceId };
				if (operation.status === "PENDING")
					throw new ApplicationError("OPERATION_IN_PROGRESS");
			}
			operation = {
				userId,
				domain,
				inputHash,
				status: "PENDING",
				resourceId: null,
				protocolVersion: 2,
				leaseExpiresAt: new Date(Date.now() + 600000),
			};
			return { token: "lease" };
		}),
		renewOperation: vi.fn(async () => true),
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
			transactions: { run: (work: () => Promise<unknown>) => work() },
			operations,
			content: { lookupContentId },
			errors: { isRecordNotFoundError: () => false },
		},
	} as unknown as WriteServiceDeps;
	return {
		service: createWriteService(deps),
		operations,
		lookupContentId,
		setOperation(
			value: Omit<MobileOperation, "protocolVersion" | "leaseExpiresAt">,
		) {
			operation = { ...value, protocolVersion: 1, leaseExpiresAt: null };
		},
	};
}
describe("Shared API operation replay", () => {
	test("returns the durable result without creating twice, rejects changed input and foreign owner", async () => {
		const { service } = fixture();
		const input = { operationId, title: "Note", markdown: "Body" };
		vi.mocked(createNote).mockImplementation(async (_input, _deps, commit) => {
			const id = await commit!(async () => "note");
			return { id };
		});
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
	test("replays modern media and rejects changed metadata", async () => {
		const { service } = fixture();
		const input: MediaInput = {
			operationId,
			domain: "images",
			contentType: "image/png",
			fileSize: 3,
			metadata: { filename: "photo.png" },
		};
		const file = new File(["png"], "photo.png", { type: "image/png" });
		vi.mocked(createImage).mockImplementation(
			async (_input, _deps, _phase, commit) => ({
				id: await commit!(async () => "image"),
			}),
		);
		const result = await service.media("owner", input, file);
		expect(await service.media("owner", input, file)).toEqual(result);
		await expect(
			service.media(
				"owner",
				{ ...input, metadata: { filename: "changed.png" } },
				file,
			),
		).rejects.toMatchObject({ code: "OPERATION_CONFLICT" });
	});
	test("rejects legacy hashes without guessing a resource", async () => {
		const { service, setOperation, lookupContentId } = fixture();
		const file = new File(["png"], "photo.png", { type: "image/png" });
		setOperation({
			userId: "owner",
			domain: "images",
			inputHash: mobileInputHash({
				operationId,
				contentType: "image/png",
				fileHash: createHash("sha256").update("png").digest("hex"),
			}),
			status: "SUCCEEDED",
			resourceId: "old-image",
		});
		await expect(
			service.media(
				"owner",
				{
					operationId,
					domain: "images",
					contentType: "image/png",
					fileSize: 3,
					metadata: { filename: "photo.png" },
				},
				file,
			),
		).rejects.toMatchObject({ code: "OPERATION_CONFLICT" });
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
