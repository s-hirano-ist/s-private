import type { MobileCreateResult } from "@s-hirano-ist/s-application/mobile/operations";
import type {
	MobileChunkStore,
	MobileUploadRepository,
	UploadRecord,
} from "@s-hirano-ist/s-application/mobile/ports";
import type { ErrorReporter } from "@s-hirano-ist/s-application/observability/reporter";
import { ApplicationError } from "@s-hirano-ist/s-application/error";
import { withLease } from "@s-hirano-ist/s-application/mobile/lease";
import { mobileInputHash } from "@s-hirano-ist/s-application/mobile/operations";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
export const uploadChunkSize = 1024 * 1024;
const ttl = 24 * 60 * 60 * 1000;
const base = {
	operationId: z.string(),
	contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
	fileSize: z
		.number()
		.int()
		.positive()
		.max(10 * 1024 * 1024),
};
const inputSchema = z.discriminatedUnion("domain", [
	z.object({
		...base,
		domain: z.literal("images"),
		metadata: z.object({ filename: z.string().min(1) }),
	}),
	z.object({
		...base,
		domain: z.literal("books"),
		metadata: z.object({
			filename: z.string().min(1).optional(),
			isbn: z.string(),
			title: z.string(),
			rating: z.number(),
			tags: z.array(z.string()),
		}),
	}),
]);
export type UploadInput = z.output<typeof inputSchema>;
export type MediaWriter = (
	owner: string,
	input: UploadInput,
	file: File,
	guard: () => Promise<void>,
) => Promise<MobileCreateResult>;
function decode(upload: UploadRecord): UploadInput {
	const stored = z.record(z.string(), z.string()).parse(upload.metadata);
	if (stored.backendContractVersion !== "1")
		throw new ApplicationError("UPLOAD_EXPIRED");
	const metadata: unknown = JSON.parse(stored.metadata);
	return inputSchema.parse({
		...upload,
		metadata,
	});
}
function session(upload: UploadRecord) {
	return {
		uploadId: upload.id,
		operationId: upload.operationId,
		chunkSize: uploadChunkSize,
		receivedParts: upload.receivedParts.toSorted((a, b) => a - b),
		expiresAt: upload.expiresAt.toISOString(),
	};
}
export function createUploads(
	deps: {
		chunks: MobileChunkStore;
		reporter: Pick<ErrorReporter, "captureException">;
		uploads: MobileUploadRepository;
	},
	write: MediaWriter,
) {
	const { uploads, chunks } = deps;
	const report = (error: unknown) => {
		try {
			deps.reporter.captureException(error, {
				tags: { phase: "upload-cleanup" },
			});
		} catch {
			/* Preserve committed results. */
		}
	};
	async function owned(owner: string, id: string) {
		const upload = await uploads.findUpload(owner, id);
		if (!upload) throw new ApplicationError("NOT_FOUND");
		if (
			upload.protocolVersion !== 2 ||
			upload.expiresAt <= new Date() ||
			["CANCELLED", "CANCELLING", "EXPIRED"].includes(upload.state)
		)
			throw new ApplicationError("UPLOAD_EXPIRED");
		return upload;
	}
	async function cleanup(upload: UploadRecord) {
		for (const chunk of await uploads.chunkKeys(upload.id, new Date())) {
			if (chunk.writingUntil && chunk.writingUntil > new Date()) continue;
			try {
				await chunks.remove(chunk.objectKey);
				await uploads.forgetChunk(chunk.objectKey);
			} catch (error) {
				report(error);
			}
		}
		await uploads.deleteExpiredUpload(upload.id, new Date());
	}
	async function sweep() {
		for (const candidate of await uploads.cleanupCandidates(new Date())) {
			let token: string | undefined;
			try {
				const claim = await uploads.claimUpload(
					candidate.userId,
					candidate.id,
					"cleanup",
				);
				token = claim.token;
				await withLease(
					() => uploads.renewUpload(candidate.id, claim.token),
					async () => {
						await cleanup(claim.upload);
					},
				);
			} catch (error) {
				if (
					!(
						error instanceof ApplicationError &&
						error.code === "OPERATION_IN_PROGRESS"
					)
				)
					report(error);
			} finally {
				if (token)
					await uploads.releaseUpload(candidate.id, token).catch(report);
			}
		}
	}
	return {
		async start(owner: string, input: UploadInput) {
			await sweep();
			const upload = await uploads.createUpload({
				...input,
				id: randomUUID(),
				userId: owner,
				metadata: {
					backendContractVersion: "1",
					metadata: JSON.stringify(input.metadata),
				},
				expiresAt: new Date(Date.now() + ttl),
			});
			await owned(owner, upload.id);
			if (mobileInputHash(decode(upload)) !== mobileInputHash(input))
				throw new ApplicationError("OPERATION_CONFLICT");
			return session(upload);
		},
		async get(owner: string, id: string) {
			return session(await owned(owner, id));
		},
		async put(owner: string, id: string, part: number, bytes: Uint8Array) {
			const upload = await owned(owner, id);
			if (upload.state !== "ACTIVE")
				throw new ApplicationError("OPERATION_IN_PROGRESS");
			const count = Math.ceil(upload.fileSize / uploadChunkSize);
			if (!Number.isInteger(part) || part < 0 || part >= count)
				throw new ApplicationError("VALIDATION_ERROR");
			const size =
				part === count - 1
					? upload.fileSize - part * uploadChunkSize
					: uploadChunkSize;
			if (bytes.byteLength !== size)
				throw new ApplicationError("INVALID_CHUNK_SIZE");
			const hash = createHash("sha256").update(bytes).digest("hex");
			const key = `mobile-uploads/${id}/${part}/${randomUUID()}`;
			await uploads.reserveChunk(owner, id, key);
			const accepted = new Set<string>();
			try {
				await withLease(
					() => uploads.renewChunk(key),
					async (assertHeld) => {
						await chunks.put(key, bytes);
						assertHeld();
						const winner = await uploads.acceptPart(owner, id, {
							part,
							hash,
							size,
							objectKey: key,
						});
						if (winner.objectKey === key) accepted.add(key);
					},
				);
				return { accepted: true as const, part };
			} finally {
				if (!accepted.has(key)) {
					try {
						await chunks.remove(key);
						await uploads.forgetChunk(key);
					} catch (error) {
						report(error);
					}
				}
				await uploads.finishChunk(key).catch(report);
			}
		},
		async complete(owner: string, id: string) {
			await owned(owner, id);
			const { upload, token } = await uploads.claimUpload(
				owner,
				id,
				"complete",
			);
			let result: MobileCreateResult | undefined;
			try {
				return await withLease(
					() => uploads.renewUpload(id, token),
					async (assertHeld) => {
						if (upload.state === "COMPLETED" && upload.resourceId)
							return {
								accepted: true as const,
								operationId: upload.operationId,
								resource: { id: upload.resourceId, type: upload.domain },
							};
						const count = Math.ceil(upload.fileSize / uploadChunkSize);
						const parts = upload.parts.toSorted((a, b) => a.part - b.part);
						if (
							parts.length !== count ||
							parts.some((part, index) => part.part !== index)
						)
							throw new ApplicationError("UPLOAD_INCOMPLETE");
						const buffers: Buffer[] = [];
						for (const part of parts) {
							const bytes = await chunks.get(part.objectKey);
							if (
								bytes.byteLength !== part.size ||
								createHash("sha256").update(bytes).digest("hex") !== part.hash
							)
								throw new ApplicationError("UPLOAD_INCOMPLETE");
							buffers.push(bytes);
						}
						const bytes = Buffer.concat(buffers);
						if (bytes.byteLength !== upload.fileSize)
							throw new ApplicationError("UPLOAD_INCOMPLETE");
						const input = decode(upload);
						const filename =
							input.metadata.filename ??
							`upload.${input.contentType.split("/").at(-1)}`;
						result = await write(
							owner,
							input,
							new File([bytes], filename, { type: input.contentType }),
							async () => {
								assertHeld();
								await uploads.assertUploadLease(id, token);
							},
						);
						await uploads.finishUpload(id, token, result.resource.id);
						await cleanup(upload).catch(report);
						return result;
					},
				);
			} catch (error) {
				if (result) {
					report(error);
					return result;
				}
				throw error;
			} finally {
				await uploads.releaseUpload(id, token).catch(report);
			}
		},
		async cancel(owner: string, id: string) {
			await owned(owner, id);
			const { upload, token } = await uploads.claimUpload(owner, id, "cancel");
			try {
				await withLease(
					() => uploads.renewUpload(id, token),
					async () => {
						await uploads.finishUpload(id, token, null);
						await cleanup(upload).catch(report);
					},
				);
			} finally {
				await uploads.releaseUpload(id, token).catch(report);
			}
		},
		cleanup: sweep,
	};
}
