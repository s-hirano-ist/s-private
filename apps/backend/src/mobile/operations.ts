import { createHash } from "node:crypto";
import { ApiError } from "s-private-backend/api/error";
import { type MobileDeps } from "s-private-backend/mobile/deps";

export type MobileCreateResult = {
	accepted: true;
	operationId: string;
	resource: { id: string; type: string };
};

function canonical(value: unknown): string {
	if (Array.isArray(value))
		return `[${value.map((item) => canonical(item)).join(",")}]`;
	if (value && typeof value === "object") {
		return `{${Object.entries(value as Record<string, unknown>)
			.filter(([, item]) => item !== undefined)
			.toSorted(([a], [b]) => a.localeCompare(b))
			.map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
			.join(",")}}`;
	}
	return JSON.stringify(value);
}

export function mobileInputHash(value: unknown): string {
	return createHash("sha256").update(canonical(value)).digest("hex");
}

export async function runMobileOperation(
	userId: string,
	domain: string,
	operationId: string,
	input: unknown,
	work: () => Promise<string>,
	deps: Pick<MobileDeps, "operations">,
): Promise<MobileCreateResult> {
	const inputHash = mobileInputHash(input);
	const existing = await deps.operations.findOperation(operationId);
	if (existing) {
		if (existing.userId !== userId) throw new ApiError("NOT_FOUND");
		if (existing.inputHash !== inputHash || existing.domain !== domain)
			throw new ApiError("OPERATION_CONFLICT");
		if (existing.status === "SUCCEEDED" && existing.resourceId) {
			return {
				accepted: true,
				operationId,
				resource: { id: existing.resourceId, type: domain },
			};
		}
		if (existing.status === "PENDING")
			throw new ApiError("OPERATION_IN_PROGRESS");
	}

	if (existing) {
		await deps.operations.markOperationPending(operationId);
	} else {
		await deps.operations.createOperation(
			operationId,
			userId,
			domain,
			inputHash,
		);
	}

	try {
		const resourceId = await work();
		await deps.operations.markOperationSucceeded(operationId, resourceId);
		return {
			accepted: true,
			operationId,
			resource: { id: resourceId, type: domain },
		};
	} catch (error) {
		await deps.operations.markOperationFailed(
			operationId,
			error instanceof ApiError ? error.code : "INTERNAL_ERROR",
		);
		throw error;
	}
}
