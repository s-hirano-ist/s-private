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
import { imageCommandRepository } from "@/features/images/repositories/image-command-repository";
import { serverLogger } from "@/o11y/server";
import type { ServerAction } from "@/types";
import { getSelfId, hasDumperPostPermission } from "@/utils/auth/session";
import {
	FileNotAllowedError,
	UnexpectedError,
} from "@/utils/error/error-classes";
import { wrapServerSideErrorForClient } from "@/utils/error/error-wrapper";
import { sanitizeFileName } from "@/utils/sanitize/sanitize-file-name";

export async function addImage(
	formData: FormData,
): Promise<ServerAction<undefined>> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	try {
		const userId = await getSelfId();

		const file = formData.get("file") as File;
		if (!file) throw new UnexpectedError();

		const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif"];
		const maxFileSize = 100 * 1024 * 1024; // 100MB
		if (!allowedMimeTypes.includes(file.type) || file.size > maxFileSize)
			throw new FileNotAllowedError();

		const sanitizedFileName = sanitizeFileName(file.name);

		const paths = `${uuidv7()}-${sanitizedFileName}`;

		const buffer = Buffer.from(await file.arrayBuffer());
		const metadata = await sharp(buffer).metadata();

		const originalPath = `${ORIGINAL_IMAGE_PATH}/${paths}`;
		await imageCommandRepository.uploadToStorage(originalPath, buffer);

		const thumbnailBuffer = await sharp(buffer)
			.resize(
				THUMBNAIL_WIDTH,
				Math.floor((metadata.height * THUMBNAIL_WIDTH) / metadata.width),
			)
			.toBuffer();
		const thumbnailPath = `${THUMBNAIL_IMAGE_PATH}/${paths}`;
		await imageCommandRepository.uploadToStorage(
			thumbnailPath,
			thumbnailBuffer,
		);

		const createdImage = await imageCommandRepository.create({
			paths,
			userId,
			contentType: file.type,
			fileSize: metadata.size,
			width: metadata.width,
			height: metadata.height,
		});

		serverLogger.info(
			`【IMAGE】\n\nコンテンツ\nfileName: ${createdImage.id}\nの登録ができました`,
			{ caller: "addImage", status: 201, userId },
			{ notify: true },
		);
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
