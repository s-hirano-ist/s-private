"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { v7 as uuidv7 } from "uuid";
import {
	ORIGINAL_IMAGE_PATH,
	THUMBNAIL_IMAGE_PATH,
	THUMBNAIL_WIDTH,
} from "@/constants";
import { env } from "@/env";
import {
	FileNotAllowedError,
	NotAllowedError,
	UnexpectedError,
} from "@/error-classes";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import {
	getSelfId,
	hasDumperPostPermission,
} from "@/features/auth/utils/session";
import { minioClient } from "@/minio";
import { loggerInfo } from "@/pino";
import db from "@/db";
import { images } from "@/db/schema";
import type { ServerAction } from "@/types";
import { sendPushoverMessage } from "@/utils/fetch-message";
import { formatCreateImageMessage } from "@/utils/format-for-notification";
import { sanitizeFileName } from "@/utils/sanitize-file-name";

export async function addImage(
	formData: FormData,
): Promise<ServerAction<undefined>> {
	try {
		const hasPostPermission = await hasDumperPostPermission();
		if (!hasPostPermission) throw new NotAllowedError();

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

		if (!metadata.width || !metadata.height) throw new UnexpectedError();

		const originalPath = `${ORIGINAL_IMAGE_PATH}/${id}`;
		await minioClient.putObject(env.MINIO_BUCKET_NAME, originalPath, buffer);

		const thumbnailBuffer = await sharp(buffer)
			.resize(
				THUMBNAIL_WIDTH,
				Math.floor((metadata.height * THUMBNAIL_WIDTH) / metadata.width),
			)
			.toBuffer();
		const thumbnailPath = `${THUMBNAIL_IMAGE_PATH}/${id}`;
		await minioClient.putObject(
			env.MINIO_BUCKET_NAME,
			thumbnailPath,
			thumbnailBuffer,
		);

		const [createdImage] = await db
			.insert(images)
			.values({
				id,
				userId,
				contentType: file.type,
				fileSize: metadata.size,
				width: metadata.width,
				height: metadata.height,
			})
			.returning({ id: images.id });

		const message = formatCreateImageMessage({ fileName: createdImage.id });
		loggerInfo(message, { caller: "addImage", status: 200 });

		await sendPushoverMessage(message);
		revalidatePath("/(dumper)");

		return {
			success: true,
			message: "inserted",
			data: undefined,
		};
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
