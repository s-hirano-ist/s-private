"use server";
import "server-only";
import {
	ORIGINAL_IMAGE_PATH,
	SUCCESS_MESSAGES,
	THUMBNAIL_IMAGE_PATH,
} from "@/constants";
import { env } from "@/env";
import { NotAllowedError } from "@/error-classes";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import { hasDumperPostPermission } from "@/features/auth/utils/session";
import { minioClient } from "@/minio";
import type { ServerAction } from "@/types";

type GenerateUrl = {
	thumbnailSrc: string;
	originalSrc: string;
};

export async function generateUrl(
	fileName: string,
): Promise<ServerAction<GenerateUrl>> {
	try {
		const hasPostPermission = await hasDumperPostPermission();
		if (!hasPostPermission) throw new NotAllowedError();

		const [thumbnailSrc, originalSrc] = await Promise.all([
			minioClient.presignedGetObject(
				env.MINIO_BUCKET_NAME,
				`${THUMBNAIL_IMAGE_PATH}/${fileName}`,
				24 * 60 * 60,
			),
			minioClient.presignedGetObject(
				env.MINIO_BUCKET_NAME,
				`${ORIGINAL_IMAGE_PATH}/${fileName}`,
				24 * 60 * 60,
			),
		]);

		return {
			success: true,
			message: SUCCESS_MESSAGES.INSERTED,
			data: { thumbnailSrc, originalSrc },
		};
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
