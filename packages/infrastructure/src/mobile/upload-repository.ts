import type {
	MobileUploadRepository,
	UploadRecord,
} from "@s-hirano-ist/s-application/mobile/ports";
import type { DatabaseClient } from "@s-hirano-ist/s-infrastructure/database";
import { ApplicationError } from "@s-hirano-ist/s-application/error";
import { leaseDurationMs } from "@s-hirano-ist/s-application/mobile/lease";
import { Prisma, withTransactionRetry } from "@s-hirano-ist/s-database";
import { randomUUID } from "node:crypto";
import { z } from "zod";
const stateSchema = z.enum([
	"ACTIVE",
	"COMPLETING",
	"COMPLETED",
	"CANCELLING",
	"CANCELLED",
	"EXPIRED",
]);
type Row = Prisma.MobileUploadGetPayload<{ include: { parts: true } }>;
function decode(row: Row): UploadRecord {
	return {
		...row,
		state: stateSchema.parse(row.state),
		receivedParts: row.parts.map((part) => part.part),
	};
}
function active(row: UploadRecord | null): asserts row is UploadRecord {
	if (!row) throw new ApplicationError("NOT_FOUND");
	if (
		row.protocolVersion !== 2 ||
		row.expiresAt <= new Date() ||
		row.state === "CANCELLED" ||
		row.state === "EXPIRED"
	)
		throw new ApplicationError("UPLOAD_EXPIRED");
}
function hasLiveLease(
	row: { leaseExpiresAt: Date | null; leaseToken: string | null },
	now: Date,
) {
	return !!row.leaseToken && !!row.leaseExpiresAt && row.leaseExpiresAt > now;
}
export function createUploadRepository(
	prisma: DatabaseClient,
): MobileUploadRepository {
	const owned = async (userId: string, id: string) => {
		const row = await prisma.mobileUpload.findFirst({
			where: { id, userId },
			include: { parts: true },
		});
		return row ? decode(row) : null;
	};

	return {
		findUpload: owned,
		async findUploadByOperation(userId, operationId) {
			const row = await prisma.mobileUpload.findUnique({
				where: { userId_operationId: { userId, operationId } },
				include: { parts: true },
			});
			return row ? decode(row) : null;
		},
		async createUpload(upload) {
			const data = {
				...upload,
				metadata: z.record(z.string(), z.string()).parse(upload.metadata),
			};
			try {
				return decode(
					await withTransactionRetry(() =>
						prisma.mobileUpload.upsert({
							where: {
								userId_operationId: {
									userId: upload.userId,
									operationId: upload.operationId,
								},
							},
							create: data,
							update: {},
							include: { parts: true },
						}),
					),
				);
			} catch (error) {
				if (
					!(
						error instanceof Prisma.PrismaClientKnownRequestError &&
						error.code === "P2002"
					)
				)
					throw error;
				return decode(
					await prisma.mobileUpload.findUniqueOrThrow({
						where: {
							userId_operationId: {
								userId: upload.userId,
								operationId: upload.operationId,
							},
						},
						include: { parts: true },
					}),
				);
			}
		},
		async reserveChunk(userId, id, objectKey) {
			await withTransactionRetry(() =>
				prisma.$transaction(async (tx) => {
					const result = await tx.mobileUpload.updateMany({
						where: {
							id,
							userId,
							protocolVersion: 2,
							state: "ACTIVE",
							expiresAt: { gt: new Date() },
						},
						data: { revision: { increment: 1 } },
					});
					if (result.count !== 1) {
						const row = await owned(userId, id);
						active(row);
						throw new ApplicationError("OPERATION_IN_PROGRESS");
					}
					await tx.mobileUploadChunk.create({
						data: {
							uploadId: id,
							objectKey,
							writingUntil: new Date(Date.now() + leaseDurationMs),
						},
					});
				}),
			);
		},
		async renewChunk(objectKey) {
			const result = await withTransactionRetry(() =>
				prisma.mobileUploadChunk.updateMany({
					where: { objectKey, writingUntil: { gt: new Date() } },
					data: { writingUntil: new Date(Date.now() + leaseDurationMs) },
				}),
			);
			return result.count === 1;
		},
		async finishChunk(objectKey) {
			await withTransactionRetry(() =>
				prisma.mobileUploadChunk.updateMany({
					where: { objectKey },
					data: { writingUntil: null },
				}),
			);
		},
		async acceptPart(userId, id, part) {
			return withTransactionRetry(() =>
				prisma.$transaction(async (tx) => {
					const result = await tx.mobileUpload.updateMany({
						where: {
							id,
							userId,
							protocolVersion: 2,
							state: "ACTIVE",
							expiresAt: { gt: new Date() },
						},
						data: { revision: { increment: 1 } },
					});
					if (result.count !== 1) {
						const row = await owned(userId, id);
						active(row);
						throw new ApplicationError("OPERATION_IN_PROGRESS");
					}
					const chunk = await tx.mobileUploadChunk.findUnique({
						where: { objectKey: part.objectKey },
					});
					if (!chunk || !chunk.writingUntil || chunk.writingUntil <= new Date())
						throw new ApplicationError("OPERATION_IN_PROGRESS");
					const existing = await tx.mobileUploadPart.findUnique({
						where: { uploadId_part: { uploadId: id, part: part.part } },
					});
					if (existing) {
						if (existing.hash !== part.hash || existing.size !== part.size)
							throw new ApplicationError("OPERATION_CONFLICT");
						return existing;
					}
					return tx.mobileUploadPart.create({
						data: { uploadId: id, ...part },
					});
				}),
			);
		},
		async claimUpload(userId, id, action) {
			return withTransactionRetry(() =>
				prisma.$transaction(async (tx) => {
					const stored = await tx.mobileUpload.findFirst({
						where: { id, userId },
						include: { parts: true },
					});
					const upload = stored ? decode(stored) : null;
					if (!stored || !upload) throw new ApplicationError("NOT_FOUND");
					if (action !== "cleanup") active(upload);
					const now = new Date();
					if (hasLiveLease(stored, now))
						throw new ApplicationError("OPERATION_IN_PROGRESS");
					if (action === "cancel") {
						const operation = await tx.mobileOperation.findUnique({
							where: { id: upload.operationId },
						});
						if (
							upload.state === "COMPLETED" ||
							(operation?.userId === userId && operation.status === "SUCCEEDED")
						)
							throw new ApplicationError("OPERATION_CONFLICT");
					}
					if (
						action === "complete" &&
						!["ACTIVE", "COMPLETING", "COMPLETED"].includes(upload.state)
					)
						throw new ApplicationError("UPLOAD_EXPIRED");
					if (
						action === "cleanup" &&
						upload.expiresAt > now &&
						!["COMPLETED", "CANCELLED", "CANCELLING", "EXPIRED"].includes(
							upload.state,
						)
					)
						throw new ApplicationError("OPERATION_IN_PROGRESS");
					const token = randomUUID();
					let state = upload.state;
					if (action === "complete" && state !== "COMPLETED")
						state = "COMPLETING";
					if (action === "cancel") state = "CANCELLING";
					if (action === "cleanup" && upload.expiresAt <= now)
						state = "EXPIRED";
					await tx.mobileUpload.update({
						where: { id },
						data: {
							state,
							leaseToken: token,
							leaseExpiresAt: new Date(now.getTime() + leaseDurationMs),
						},
					});
					return { upload: { ...upload, state }, token };
				}),
			);
		},
		async renewUpload(id, token) {
			const now = new Date();
			const result = await withTransactionRetry(() =>
				prisma.mobileUpload.updateMany({
					where: { id, leaseToken: token, leaseExpiresAt: { gt: now } },
					data: { leaseExpiresAt: new Date(now.getTime() + leaseDurationMs) },
				}),
			);
			return result.count === 1;
		},
		async assertUploadLease(id, token) {
			const result = await prisma.mobileUpload.updateMany({
				where: {
					id,
					leaseToken: token,
					state: "COMPLETING",
					expiresAt: { gt: new Date() },
					leaseExpiresAt: { gt: new Date() },
				},
				data: { revision: { increment: 1 } },
			});
			if (result.count !== 1)
				throw new ApplicationError("OPERATION_IN_PROGRESS");
		},
		async finishUpload(id, token, resourceId) {
			const result = await withTransactionRetry(() =>
				prisma.mobileUpload.updateMany({
					where: { id, leaseToken: token, leaseExpiresAt: { gt: new Date() } },
					data: { state: resourceId ? "COMPLETED" : "CANCELLED", resourceId },
				}),
			);
			if (result.count !== 1)
				throw new ApplicationError("OPERATION_IN_PROGRESS");
		},
		async releaseUpload(id, token) {
			await withTransactionRetry(() =>
				prisma.mobileUpload.updateMany({
					where: { id, leaseToken: token, state: "COMPLETING" },
					data: { state: "ACTIVE" },
				}),
			);
			await withTransactionRetry(() =>
				prisma.mobileUpload.updateMany({
					where: { id, leaseToken: token },
					data: { leaseToken: null, leaseExpiresAt: null },
				}),
			);
		},
		async cleanupCandidates(now) {
			const rows = await prisma.mobileUpload.findMany({
				where: {
					OR: [
						{ expiresAt: { lte: now } },
						{
							state: {
								in: ["COMPLETED", "CANCELLED", "CANCELLING", "EXPIRED"],
							},
						},
					],
				},
				include: { parts: true },
			});
			return rows.map((row) => decode(row));
		},
		async chunkKeys(id) {
			return prisma.mobileUploadChunk.findMany({
				where: { uploadId: id },
				select: { objectKey: true, writingUntil: true },
			});
		},
		async forgetChunk(objectKey) {
			await prisma.mobileUploadChunk.deleteMany({ where: { objectKey } });
		},
		async deleteExpiredUpload(id, now) {
			await prisma.mobileUpload.deleteMany({
				where: { id, expiresAt: { lte: now }, chunks: { none: {} } },
			});
		},
	};
}
