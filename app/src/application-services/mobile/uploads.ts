import "server-only";
import { MobileApiError } from "@/application-services/mobile/auth";
import {
	createMobileContent,
	domainSchema,
} from "@/application-services/mobile/content";
import {
	defaultMobileDeps,
	type MobileDeps,
} from "@/application-services/mobile/deps";
import {
	type MobileCreateResult,
	mobileInputHash,
} from "@/application-services/mobile/operations";
import { z } from "zod";

export const MOBILE_CHUNK_SIZE = 1024 * 1024;
export const MOBILE_UPLOAD_LIMIT = 10 * 1024 * 1024;
const uploadTTL = 24 * 60 * 60 * 1000;
const startSchema = z.strictObject({
	operationId: z.uuid(),
	domain: z.enum(["images", "books"]),
	contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
	fileSize: z.number().int().positive().max(MOBILE_UPLOAD_LIMIT),
	metadata: z.record(z.string(), z.string()).default({}),
});

export async function startMobileUpload(
	userId: string,
	body: unknown,
	deps: Pick<
		MobileDeps,
		"uploads" | "chunks" | "content" | "operations"
	> = defaultMobileDeps,
) {
	await cleanupExpiredMobileUploads(new Date(), deps);
	const input = startSchema.parse(body);
	const existing = await deps.uploads.findUploadByOperation(
		userId,
		input.operationId,
	);
	if (existing) {
		if (
			existing.domain !== input.domain ||
			existing.fileSize !== input.fileSize ||
			existing.contentType !== input.contentType ||
			mobileInputHash(existing.metadata) !== mobileInputHash(input.metadata)
		)
			throw new MobileApiError("OPERATION_CONFLICT", 409);
		return serializeUpload(existing);
	}
	const upload = await deps.uploads.createUpload({
		id: crypto.randomUUID(),
		userId,
		...input,
		expiresAt: new Date(Date.now() + uploadTTL),
	});
	return serializeUpload(upload);
}

export async function getMobileUpload(
	userId: string,
	id: string,
	deps: Pick<
		MobileDeps,
		"uploads" | "chunks" | "content" | "operations"
	> = defaultMobileDeps,
) {
	return serializeUpload(await ownedUpload(userId, id, deps));
}

export async function putMobileChunk(
	userId: string,
	id: string,
	part: number,
	bytes: Uint8Array,
	deps: Pick<
		MobileDeps,
		"uploads" | "chunks" | "content" | "operations"
	> = defaultMobileDeps,
) {
	const upload = await ownedUpload(userId, id, deps);
	const parts = Math.ceil(upload.fileSize / MOBILE_CHUNK_SIZE);
	if (!Number.isInteger(part) || part < 0 || part >= parts)
		throw new MobileApiError("VALIDATION_ERROR", 422);
	const expected =
		part === parts - 1
			? upload.fileSize - part * MOBILE_CHUNK_SIZE
			: MOBILE_CHUNK_SIZE;
	if (bytes.byteLength !== expected)
		throw new MobileApiError("INVALID_CHUNK_SIZE", 422);
	await deps.chunks.put(id, part, bytes);
	if (!upload.receivedParts.includes(part)) {
		await deps.uploads.updateUploadParts(
			id,
			[...upload.receivedParts, part].toSorted((a, b) => a - b),
		);
	}
	return { accepted: true, part };
}

export async function completeMobileUpload(
	userId: string,
	id: string,
	deps: Pick<
		MobileDeps,
		"uploads" | "chunks" | "content" | "operations"
	> = defaultMobileDeps,
): Promise<MobileCreateResult> {
	const upload = await ownedUpload(userId, id, deps);
	const count = Math.ceil(upload.fileSize / MOBILE_CHUNK_SIZE);
	if (
		upload.receivedParts.length !== count ||
		upload.receivedParts.some((part, index) => part !== index)
	)
		throw new MobileApiError("UPLOAD_INCOMPLETE", 409);
	const chunks: Buffer[] = [];
	for (let part = 0; part < count; part += 1) {
		chunks.push(await deps.chunks.get(id, part));
	}
	const bytes = Buffer.concat(chunks);
	if (bytes.byteLength !== upload.fileSize)
		throw new MobileApiError("UPLOAD_INCOMPLETE", 409);
	const form = new FormData();
	for (const [key, value] of Object.entries(
		upload.metadata as Record<string, string>,
	))
		form.set(key, value);
	form.set("operationId", upload.operationId);
	form.set(
		upload.domain === "images" ? "file" : "image",
		new File([bytes], "upload", { type: upload.contentType }),
	);
	const result = await createMobileContent(
		domainSchema.parse(upload.domain),
		userId,
		form,
		deps,
	);
	await cancelMobileUpload(userId, id, deps);
	return result;
}

export async function cancelMobileUpload(
	userId: string,
	id: string,
	deps: Pick<
		MobileDeps,
		"uploads" | "chunks" | "content" | "operations"
	> = defaultMobileDeps,
): Promise<void> {
	const upload = await ownedUpload(userId, id, deps);
	await Promise.allSettled(
		upload.receivedParts.map((part) => deps.chunks.remove(id, part)),
	);
	await deps.uploads.deleteUpload(id);
}

export async function cleanupExpiredMobileUploads(
	now = new Date(),
	deps: Pick<
		MobileDeps,
		"uploads" | "chunks" | "content" | "operations"
	> = defaultMobileDeps,
): Promise<number> {
	const uploads = await deps.uploads.findExpiredUploads(now);
	for (const upload of uploads) {
		await Promise.allSettled(
			upload.receivedParts.map((part) => deps.chunks.remove(upload.id, part)),
		);
		await deps.uploads.deleteUpload(upload.id);
	}
	return uploads.length;
}

async function ownedUpload(
	userId: string,
	id: string,
	deps: Pick<MobileDeps, "uploads" | "chunks">,
) {
	const upload = await deps.uploads.findUpload(userId, id);
	if (!upload) throw new MobileApiError("NOT_FOUND", 404);
	if (upload.expiresAt <= new Date())
		throw new MobileApiError("UPLOAD_EXPIRED", 410);
	return upload;
}

function serializeUpload(upload: {
	expiresAt: Date;
	id: string;
	operationId: string;
	receivedParts: number[];
}) {
	return {
		uploadId: upload.id,
		operationId: upload.operationId,
		chunkSize: MOBILE_CHUNK_SIZE,
		receivedParts: upload.receivedParts,
		expiresAt: upload.expiresAt,
	};
}
