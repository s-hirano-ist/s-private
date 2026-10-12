import type {
	MediaInput,
	WriteService,
} from "@s-hirano-ist/s-backend/api/write-service";
import type { MobileDeps } from "@s-hirano-ist/s-backend/mobile/deps";
import type { MobileUpload } from "@s-hirano-ist/s-backend/mobile/ports";
import * as schemas from "@s-hirano-ist/s-api-contracts/schemas";
import { MobileApiError } from "@s-hirano-ist/s-backend/mobile/error";
import { mobileInputHash } from "@s-hirano-ist/s-backend/mobile/operations";
import { z } from "zod";
const ttl = 24 * 60 * 60 * 1000;
const metadataRecord = z.record(z.string(), z.string());
function decode(upload: MobileUpload): {
	input: MediaInput;
	legacyMetadata?: Record<string, string>;
} {
	const stored = metadataRecord.parse(upload.metadata);
	let metadata: unknown;
	if (stored.backendContractVersion === "1")
		metadata = JSON.parse(stored.metadata);
	else if (upload.domain === "images")
		metadata = { filename: stored.filename || "upload" };
	else {
		const old = z
			.object({
				isbn: z.string(),
				title: z.string(),
				rating: z.coerce.number().int(),
				tags: z.string().default(""),
			})
			.parse(stored);
		metadata = {
			...old,
			tags: old.tags
				.split(",")
				.map((tag) => tag.trim())
				.filter(Boolean),
		};
	}
	return {
		input: schemas.uploadStartSchema.parse({
			operationId: upload.operationId,
			domain: upload.domain,
			contentType: upload.contentType,
			fileSize: upload.fileSize,
			metadata,
		}),
		...(stored.backendContractVersion === "1"
			? {}
			: { legacyMetadata: stored }),
	};
}
function session(upload: MobileUpload) {
	return schemas.uploadSessionSchema.parse({
		uploadId: upload.id,
		operationId: upload.operationId,
		chunkSize: schemas.uploadChunkSize,
		receivedParts: upload.receivedParts.toSorted((a, b) => a - b),
		expiresAt: upload.expiresAt.toISOString(),
	});
}
export function createUploadService(
	deps: Pick<MobileDeps, "uploads" | "chunks">,
	writes: Pick<WriteService, "media">,
) {
	async function owned(owner: string, id: string) {
		const upload = await deps.uploads.findUpload(owner, id);
		if (!upload) throw new MobileApiError("NOT_FOUND", 404);
		if (upload.expiresAt <= new Date())
			throw new MobileApiError("UPLOAD_EXPIRED", 410);
		return upload;
	}
	async function cleanup(upload: MobileUpload) {
		await Promise.allSettled(
			upload.receivedParts.map((part) => deps.chunks.remove(upload.id, part)),
		);
		await deps.uploads.deleteUpload(upload.id);
	}
	return {
		async start(owner: string, input: MediaInput) {
			for (const expired of await deps.uploads.findExpiredUploads(new Date()))
				await cleanup(expired);
			const existing = await deps.uploads.findUploadByOperation(
				owner,
				input.operationId,
			);
			if (existing) {
				const { input: previous, legacyMetadata } = decode(existing);
				const left = { ...previous };
				const right = { ...input };
				if (
					legacyMetadata &&
					previous.domain === "books" &&
					right.domain === "books"
				) {
					const { filename: _filename, ...metadata } = right.metadata;
					right.metadata = {
						...metadata,
						tags: metadata.tags.map((tag) => tag.trim()).filter(Boolean),
					};
				}
				// Old clients did not send an image filename. Resuming their bytes is safe.
				if (
					legacyMetadata &&
					previous.domain === "images" &&
					input.domain === "images" &&
					!legacyMetadata.filename
				) {
					left.metadata = { filename: input.metadata.filename };
				}
				if (mobileInputHash(left) !== mobileInputHash(right))
					throw new MobileApiError("OPERATION_CONFLICT", 409);
				return session(existing);
			}
			return session(
				await deps.uploads.createUpload({
					id: crypto.randomUUID(),
					userId: owner,
					...input,
					metadata: {
						backendContractVersion: "1",
						metadata: JSON.stringify(input.metadata),
					},
					expiresAt: new Date(Date.now() + ttl),
				}),
			);
		},
		async get(owner: string, id: string) {
			return session(await owned(owner, id));
		},
		async put(owner: string, id: string, part: number, bytes: Uint8Array) {
			const upload = await owned(owner, id);
			const count = Math.ceil(upload.fileSize / schemas.uploadChunkSize);
			if (!Number.isInteger(part) || part < 0 || part >= count)
				throw new MobileApiError("VALIDATION_ERROR", 422);
			const expected =
				part === count - 1
					? upload.fileSize - part * schemas.uploadChunkSize
					: schemas.uploadChunkSize;
			if (bytes.byteLength !== expected)
				throw new MobileApiError("INVALID_CHUNK_SIZE", 422);
			await deps.chunks.put(id, part, bytes);
			if (!upload.receivedParts.includes(part))
				await deps.uploads.updateUploadParts(
					id,
					[...upload.receivedParts, part].toSorted((a, b) => a - b),
				);
			return { accepted: true as const, part };
		},
		async complete(owner: string, id: string) {
			const upload = await owned(owner, id);
			const count = Math.ceil(upload.fileSize / schemas.uploadChunkSize);
			const parts = upload.receivedParts.toSorted((a, b) => a - b);
			if (parts.length !== count || parts.some((part, index) => part !== index))
				throw new MobileApiError("UPLOAD_INCOMPLETE", 409);
			const chunks: Buffer[] = [];
			for (let part = 0; part < count; part++)
				chunks.push(await deps.chunks.get(id, part));
			const bytes = Buffer.concat(chunks);
			if (bytes.byteLength !== upload.fileSize)
				throw new MobileApiError("UPLOAD_INCOMPLETE", 409);
			const { input, legacyMetadata } = decode(upload);
			const filename =
				input.metadata.filename ??
				`upload.${input.contentType.split("/").at(-1) ?? "jpeg"}`;
			const file = new File([bytes], filename, { type: input.contentType });
			const result = await writes.media(owner, input, file, legacyMetadata);
			await cleanup(upload);
			return result;
		},
		async cancel(owner: string, id: string) {
			await cleanup(await owned(owner, id));
		},
	};
}
export type UploadService = ReturnType<typeof createUploadService>;
