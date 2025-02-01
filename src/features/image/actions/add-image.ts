"use server";
import "server-only";
import {
	ORIGINAL_IMAGE_PATH,
	SUCCESS_MESSAGES,
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
import prisma from "@/prisma";
import type { ServerAction } from "@/types";
import { sendLineNotifyMessage } from "@/utils/fetch-message";
import { formatCreateImageMessage } from "@/utils/format-for-line";
import { sanitizeFileName } from "@/utils/sanitize-file-name";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { v7 as uuidv7 } from "uuid";

export async function addImage(
	formData: FormData,
	index: number,
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

		const createdImage = await prisma.images.create({
			data: {
				id,
				userId,
				contentType: file.type,
				fileSize: metadata.size,
				width: metadata.width,
				height: metadata.height,
			},
			select: { id: true },
		});

		const message = formatCreateImageMessage({ fileName: createdImage.id });
		loggerInfo(message, { caller: "addImage", status: 200 });

		await sendLineNotifyMessage(message);
		revalidatePath("/(dumper)");
		await prisma.$accelerate.invalidate({ tags: ["images"] });

		return {
			success: true,
			message: `${String(index)}番目の画像が${SUCCESS_MESSAGES.INSERTED}`,
			data: undefined,
		};
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
