import type { MutationCommit } from "@s-hirano-ist/s-application/transaction";
import { ApplicationError } from "@s-hirano-ist/s-application/error";
import { type MobileDeps } from "@s-hirano-ist/s-application/mobile/deps";
import { withLease } from "@s-hirano-ist/s-application/mobile/lease";
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
	work: (commit: MutationCommit) => Promise<string>,
	deps: Pick<MobileDeps, "operations" | "transactions">,
): Promise<MobileCreateResult> {
	const inputHash = mobileInputHash(input);
	const claim = await deps.operations.claimOperation(
		operationId,
		userId,
		domain,
		inputHash,
	);
	const result = (resourceId: string): MobileCreateResult => ({
		accepted: true,
		operationId,
		resource: { id: resourceId, type: domain },
	});
	if ("resourceId" in claim) return result(claim.resourceId);
	return withLease(
		() => deps.operations.renewOperation(operationId, claim.token),
		async (assertHeld) => {
			let committed: string | undefined;
			try {
				const resourceId = await work((persist) =>
					deps.transactions
						.run(async () => {
							assertHeld();
							const id = await persist();
							await deps.operations.markOperationSucceeded(
								operationId,
								id,
								claim.token,
							);
							return id;
						})
						.then((id) => {
							committed = id;
							return id;
						}),
				);
				if (!committed) throw new ApplicationError("INTERNAL_ERROR");
				return result(resourceId);
			} catch (error) {
				if (committed) return result(committed);
				await deps.operations.markOperationFailed(
					operationId,
					error instanceof ApplicationError ? error.code : "INTERNAL_ERROR",
					claim.token,
				);
				throw error;
			}
		},
	);
}
