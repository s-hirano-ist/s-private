import type { MobileOperationRepository } from "@s-hirano-ist/s-application/mobile/ports";
import type { DatabaseClient } from "@s-hirano-ist/s-infrastructure/database";
import { ApplicationError } from "@s-hirano-ist/s-application/error";
import { leaseDurationMs } from "@s-hirano-ist/s-application/mobile/lease";
import { Prisma, withTransactionRetry } from "@s-hirano-ist/s-database";
import { randomUUID } from "node:crypto";

export function createOperationRepository(
	prisma: DatabaseClient,
): MobileOperationRepository {
	return {
		findOperation: (id) => prisma.mobileOperation.findUnique({ where: { id } }),
		async claimOperation(id, userId, domain, inputHash) {
			// Establish a unique identity before the serializable claim. A concurrent insert
			// may win; identity and ownership are checked again inside the transaction.
			try {
				await withTransactionRetry(() =>
					prisma.mobileOperation.upsert({
						where: { id },
						create: { id, userId, domain, inputHash, status: "FAILED" },
						update: {},
					}),
				);
			} catch (error) {
				if (
					!(
						error instanceof Prisma.PrismaClientKnownRequestError &&
						error.code === "P2002"
					)
				)
					throw error;
			}
			return withTransactionRetry(() =>
				prisma.$transaction(async (tx) => {
					const operation = await tx.mobileOperation.findUniqueOrThrow({
						where: { id },
					});
					if (operation.userId !== userId)
						throw new ApplicationError("NOT_FOUND");
					if (operation.domain !== domain || operation.inputHash !== inputHash)
						throw new ApplicationError("OPERATION_CONFLICT");
					if (operation.status === "SUCCEEDED" && operation.resourceId)
						return { resourceId: operation.resourceId };
					if (operation.protocolVersion !== 2)
						throw new ApplicationError("OPERATION_CONFLICT");
					const now = new Date();
					if (
						operation.status === "PENDING" &&
						operation.leaseExpiresAt &&
						operation.leaseExpiresAt > now
					)
						throw new ApplicationError("OPERATION_IN_PROGRESS");
					const token = randomUUID();
					await tx.mobileOperation.update({
						where: { id },
						data: {
							status: "PENDING",
							errorCode: null,
							leaseToken: token,
							leaseExpiresAt: new Date(now.getTime() + leaseDurationMs),
						},
					});
					return { token };
				}),
			);
		},
		async renewOperation(id, token) {
			const now = new Date();
			const result = await withTransactionRetry(() =>
				prisma.mobileOperation.updateMany({
					where: {
						id,
						leaseToken: token,
						status: "PENDING",
						leaseExpiresAt: { gt: now },
					},
					data: { leaseExpiresAt: new Date(now.getTime() + leaseDurationMs) },
				}),
			);
			return result.count === 1;
		},
		async markOperationSucceeded(id, resourceId, token) {
			const result = await prisma.mobileOperation.updateMany({
				where: {
					id,
					leaseToken: token,
					status: "PENDING",
					leaseExpiresAt: { gt: new Date() },
				},
				data: {
					status: "SUCCEEDED",
					resourceId,
					errorCode: null,
					leaseToken: null,
					leaseExpiresAt: null,
				},
			});
			if (result.count !== 1)
				throw new ApplicationError("OPERATION_IN_PROGRESS");
		},
		async markOperationFailed(id, errorCode, token) {
			await withTransactionRetry(() =>
				prisma.mobileOperation.updateMany({
					where: {
						id,
						leaseToken: token,
						status: "PENDING",
						leaseExpiresAt: { gt: new Date() },
					},
					data: {
						status: "FAILED",
						errorCode,
						leaseToken: null,
						leaseExpiresAt: null,
					},
				}),
			);
		},
	};
}
