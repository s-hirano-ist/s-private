import "server-only";
import { MobileApiError } from "@/application-services/mobile/auth";
import {
	createMobileContent,
	domainSchema,
} from "@/application-services/mobile/content";
import {
	type MobileCreateResult,
	mobileInputHash,
} from "@/application-services/mobile/operations";
import { env } from "@/env";
import { minioClient } from "@/minio";
import prisma from "@/prisma";
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

function objectKey(uploadId: string, part: number): string {
	return `mobile-uploads/${uploadId}/${part}`;
}

export async function startMobileUpload(userId: string, body: unknown) {
	await cleanupExpiredMobileUploads();
	const input = startSchema.parse(body);
	const existing = await prisma.mobileUpload.findFirst({
		where: { userId, operationId: input.operationId },
	});
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
	const upload = await prisma.mobileUpload.create({
		data: {
			id: crypto.randomUUID(),
			userId,
			...input,
			expiresAt: new Date(Date.now() + uploadTTL),
		},
	});
	return serializeUpload(upload);
}

export async function getMobileUpload(userId: string, id: string) {
	return serializeUpload(await ownedUpload(userId, id));
}

export async function putMobileChunk(
	userId: string,
	id: string,
	part: number,
	bytes: Uint8Array,
) {
	const upload = await ownedUpload(userId, id);
	const parts = Math.ceil(upload.fileSize / MOBILE_CHUNK_SIZE);
	if (!Number.isInteger(part) || part < 0 || part >= parts)
		throw new MobileApiError("VALIDATION_ERROR", 422);
	const expected =
		part === parts - 1
			? upload.fileSize - part * MOBILE_CHUNK_SIZE
			: MOBILE_CHUNK_SIZE;
	if (bytes.byteLength !== expected)
		throw new MobileApiError("INVALID_CHUNK_SIZE", 422);
	await minioClient.putObject(
		env.MINIO_BUCKET_NAME,
		objectKey(id, part),
		Buffer.from(bytes),
	);
	if (!upload.receivedParts.includes(part)) {
		await prisma.mobileUpload.update({
			where: { id },
			data: {
				receivedParts: [...upload.receivedParts, part].toSorted(
					(a, b) => a - b,
				),
			},
		});
	}
	return { accepted: true, part };
}

export async function completeMobileUpload(
	userId: string,
	id: string,
): Promise<MobileCreateResult> {
	const upload = await ownedUpload(userId, id);
	const count = Math.ceil(upload.fileSize / MOBILE_CHUNK_SIZE);
	if (
		upload.receivedParts.length !== count ||
		upload.receivedParts.some((part, index) => part !== index)
	)
		throw new MobileApiError("UPLOAD_INCOMPLETE", 409);
	const buffers: Buffer[] = [];
	for (let part = 0; part < count; part += 1) {
		const stream = await minioClient.getObject(
			env.MINIO_BUCKET_NAME,
			objectKey(id, part),
		);
		for await (const chunk of stream)
			buffers.push(Buffer.from(chunk as Uint8Array));
	}
	const bytes = Buffer.concat(buffers);
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
	);
	await cancelMobileUpload(userId, id);
	return result;
}

export async function cancelMobileUpload(
	userId: string,
	id: string,
): Promise<void> {
	const upload = await ownedUpload(userId, id);
	await Promise.allSettled(
		upload.receivedParts.map((part) =>
			minioClient.removeObject(env.MINIO_BUCKET_NAME, objectKey(id, part)),
		),
	);
	await prisma.mobileUpload.delete({ where: { id } });
}

export async function cleanupExpiredMobileUploads(
	now = new Date(),
): Promise<number> {
	const uploads = await prisma.mobileUpload.findMany({
		where: { expiresAt: { lt: now } },
	});
	for (const upload of uploads) {
		await Promise.allSettled(
			upload.receivedParts.map((part) =>
				minioClient.removeObject(
					env.MINIO_BUCKET_NAME,
					objectKey(upload.id, part),
				),
			),
		);
		await prisma.mobileUpload.delete({ where: { id: upload.id } });
	}
	return uploads.length;
}

async function ownedUpload(userId: string, id: string) {
	const upload = await prisma.mobileUpload.findFirst({ where: { id, userId } });
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
