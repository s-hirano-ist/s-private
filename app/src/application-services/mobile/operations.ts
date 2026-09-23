import "server-only";
import { MobileApiError } from "@/application-services/mobile/auth";
import prisma from "@/prisma";
import { createHash } from "node:crypto";

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
): Promise<MobileCreateResult> {
	const inputHash = mobileInputHash(input);
	const existing = await prisma.mobileOperation.findUnique({
		where: { id: operationId },
	});
	if (existing) {
		if (existing.userId !== userId) throw new MobileApiError("NOT_FOUND", 404);
		if (existing.inputHash !== inputHash || existing.domain !== domain)
			throw new MobileApiError("OPERATION_CONFLICT", 409);
		if (existing.status === "SUCCEEDED" && existing.resourceId) {
			return {
				accepted: true,
				operationId,
				resource: { id: existing.resourceId, type: domain },
			};
		}
		if (existing.status === "PENDING")
			throw new MobileApiError("OPERATION_IN_PROGRESS", 409);
	}

	if (existing) {
		await prisma.mobileOperation.update({
			where: { id: operationId },
			data: { status: "PENDING", errorCode: null },
		});
	} else {
		await prisma.mobileOperation.create({
			data: { id: operationId, userId, domain, inputHash },
		});
	}

	try {
		const resourceId = await work();
		await prisma.mobileOperation.update({
			where: { id: operationId },
			data: { status: "SUCCEEDED", resourceId },
		});
		return {
			accepted: true,
			operationId,
			resource: { id: resourceId, type: domain },
		};
	} catch (error) {
		await prisma.mobileOperation.update({
			where: { id: operationId },
			data: {
				status: "FAILED",
				errorCode:
					error instanceof MobileApiError ? error.code : "INTERNAL_ERROR",
			},
		});
		throw error;
	}
}
