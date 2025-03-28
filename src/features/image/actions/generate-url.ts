"use server";
import "server-only";
import { ORIGINAL_IMAGE_PATH, THUMBNAIL_IMAGE_PATH } from "@/constants";
import { env } from "@/env";
import { NotAllowedError } from "@/error-classes";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import { hasDumperPostPermission } from "@/features/auth/utils/session";
import { minioClient } from "@/minio";
import type { ServerAction } from "@/types";

type GenerateUrl = {
	originalSrc: string;
	thumbnailSrc: string;
};

export async function generateUrl(
	fileName: string,
): Promise<ServerAction<GenerateUrl>> {
	try {
		const hasPostPermission = await hasDumperPostPermission();
		if (!hasPostPermission) throw new NotAllowedError();

		const [thumbnailSource, originalSource] = await Promise.all([
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
			message: "success",
			data: { thumbnailSrc: thumbnailSource, originalSrc: originalSource },
		};
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
