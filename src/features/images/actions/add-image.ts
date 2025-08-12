"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import sharp from "sharp";
import { v7 as uuidv7 } from "uuid";
import {
	ORIGINAL_IMAGE_PATH,
	THUMBNAIL_IMAGE_PATH,
	THUMBNAIL_WIDTH,
} from "@/constants";
import { FileNotAllowedError, UnexpectedError } from "@/error-classes";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import { imageCommandRepository } from "@/features/images/repositories/image-command-repository";
import { loggerInfo } from "@/pino";
import type { ServerAction } from "@/types";
import { getSelfId, hasDumperPostPermission } from "@/utils/auth/session";
import { sendPushoverMessage } from "@/utils/notification/fetch-message";
import { formatCreateImageMessage } from "@/utils/notification/format-for-notification";
import { sanitizeFileName } from "@/utils/sanitize/sanitize-file-name";

export async function addImage(
	formData: FormData,
): Promise<ServerAction<undefined>> {
	const hasPostPermission = await hasDumperPostPermission();
	if (!hasPostPermission) forbidden();

	try {
		const userId = await getSelfId();

		const file = formData.get("file") as File;
		if (!file) throw new UnexpectedError();

		const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif"];
		const maxFileSize = 100 * 1024 * 1024; // 100MB
		if (!allowedMimeTypes.includes(file.type) || file.size > maxFileSize)
			throw new FileNotAllowedError();

		const sanitizedFileName = sanitizeFileName(file.name);

		const id = `${uuidv7()}-${sanitizedFileName}`;

		const buffer = Buffer.from(await file.arrayBuffer());
		const metadata = await sharp(buffer).metadata();

		const originalPath = `${ORIGINAL_IMAGE_PATH}/${id}`;
		await imageCommandRepository.uploadToStorage(originalPath, buffer);

		const thumbnailBuffer = await sharp(buffer)
			.resize(
				THUMBNAIL_WIDTH,
				Math.floor((metadata.height * THUMBNAIL_WIDTH) / metadata.width),
			)
			.toBuffer();
		const thumbnailPath = `${THUMBNAIL_IMAGE_PATH}/${id}`;
		await imageCommandRepository.uploadToStorage(
			thumbnailPath,
			thumbnailBuffer,
		);

		const createdImage = await imageCommandRepository.create({
			id,
			userId,
			contentType: file.type,
			fileSize: metadata.size,
			width: metadata.width,
			height: metadata.height,
		});

		const message = formatCreateImageMessage({ fileName: createdImage.id });
		loggerInfo(message, { caller: "addImage", status: 200 });

		await sendPushoverMessage(message);
		revalidatePath("/(dumper)");
		await imageCommandRepository.invalidateCache();

		return {
			success: true,
			message: "inserted",
			data: undefined,
		};
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
