"use client";
import type { ServerAction } from "@/common/types";
import type { UploadStart as UploadInput } from "@s-hirano-ist/s-api-client/models";
import { backendActionError } from "@/common/backend/action-error";
import { getBrowserBackendClient } from "@/common/backend/browser-client";
import { UploadStart } from "@s-hirano-ist/s-api-client/models";
import { z } from "zod";
const imageOperations = new WeakMap<File, string>();
async function upload(file: File, input: UploadInput) {
	const client = getBrowserBackendClient();
	const { data: session } = await client.startUpload(input);
	const count = Math.ceil(file.size / session.chunkSize);
	for (let part = 0; part < count; part++) {
		if (session.receivedParts.includes(part)) continue;
		await client.putUploadChunk(
			session.uploadId,
			part,
			file.slice(
				part * session.chunkSize,
				Math.min((part + 1) * session.chunkSize, file.size),
			),
		);
	}
	await client.completeUpload(session.uploadId);
	return { success: true, message: "inserted" };
}
function contentType(file: File) {
	if (file.type) return file.type;
	const extension = file.name.split(".").at(-1)?.toLowerCase();
	if (extension === "png") return "image/png";
	if (extension === "webp") return "image/webp";
	return "image/jpeg";
}
export async function uploadImage(formData: FormData): Promise<ServerAction> {
	try {
		const file = z.instanceof(File).parse(formData.get("file"));
		const operationId = imageOperations.get(file) ?? crypto.randomUUID();
		imageOperations.set(file, operationId);
		const input = UploadStart.parse({
			operationId,
			domain: "images",
			contentType: contentType(file),
			fileSize: file.size,
			metadata: { filename: file.name },
		});
		return await upload(file, input);
	} catch (error) {
		return backendActionError(error);
	}
}
export async function uploadBook(formData: FormData): Promise<ServerAction> {
	try {
		const file = z.instanceof(File).parse(formData.get("image"));
		const input = UploadStart.parse({
			operationId: formData.get("operationId"),
			domain: "books",
			contentType: contentType(file),
			fileSize: file.size,
			metadata: {
				filename: file.name,
				isbn: formData.get("isbn"),
				title: formData.get("title"),
				rating: Number(formData.get("rating")),
				tags: z
					.string()
					.parse(formData.get("tags"))
					.split(",")
					.map((tag) => tag.trim())
					.filter(Boolean),
			},
		});
		return await upload(file, input);
	} catch (error) {
		return backendActionError(error, formData);
	}
}
