import { beforeEach, describe, expect, test, vi } from "vitest";

const findUnique = vi.hoisted(() => vi.fn());
const create = vi.hoisted(() => vi.fn());
const update = vi.hoisted(() => vi.fn());
vi.mock("@/prisma", () => ({
	default: { mobileOperation: { findUnique, create, update } },
}));

import { MobileApiError } from "./auth";
import { mobileInputHash, runMobileOperation } from "./operations";

describe("durable mobile operations", () => {
	beforeEach(() => vi.clearAllMocks());

	test("canonical hashes ignore object key order", () => {
		expect(mobileInputHash({ a: 1, b: [2, 3] })).toBe(
			mobileInputHash({ b: [2, 3], a: 1 }),
		);
	});

	test("returns the stored resource for an identical retry", async () => {
		const input = { operationId: "operation-1", title: "Note" };
		findUnique.mockResolvedValue({
			id: "operation-1",
			userId: "owner-1",
			domain: "notes",
			inputHash: mobileInputHash(input),
			status: "SUCCEEDED",
			resourceId: "note-1",
		});
		const work = vi.fn();
		await expect(
			runMobileOperation("owner-1", "notes", "operation-1", input, work),
		).resolves.toEqual({
			accepted: true,
			operationId: "operation-1",
			resource: { id: "note-1", type: "notes" },
		});
		expect(work).not.toHaveBeenCalled();
	});

	test("rejects reuse with a different input and hides another owner", async () => {
		findUnique.mockResolvedValue({
			userId: "owner-1",
			domain: "notes",
			inputHash: mobileInputHash({ title: "First" }),
			status: "SUCCEEDED",
			resourceId: "note-1",
		});
		await expect(
			runMobileOperation(
				"owner-1",
				"notes",
				"operation-1",
				{ title: "Second" },
				vi.fn(),
			),
		).rejects.toMatchObject({ code: "OPERATION_CONFLICT", status: 409 });
		await expect(
			runMobileOperation(
				"owner-2",
				"notes",
				"operation-1",
				{ title: "First" },
				vi.fn(),
			),
		).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
	});

	test("records a failed operation through the injected repository", async () => {
		const operations = {
			findOperation: vi.fn().mockResolvedValue(null),
			createOperation: vi.fn().mockResolvedValue(undefined),
			markOperationPending: vi.fn(),
			markOperationSucceeded: vi.fn(),
			markOperationFailed: vi.fn().mockResolvedValue(undefined),
		};
		await expect(
			runMobileOperation(
				"owner-1",
				"notes",
				"operation-1",
				{ title: "Note" },
				async () => {
					throw new MobileApiError("VALIDATION_ERROR", 422);
				},
				{ operations },
			),
		).rejects.toMatchObject({ code: "VALIDATION_ERROR", status: 422 });
		expect(operations.createOperation).toHaveBeenCalledOnce();
		expect(operations.markOperationFailed).toHaveBeenCalledWith(
			"operation-1",
			"VALIDATION_ERROR",
		);
	});
});
