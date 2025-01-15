"use server";
import "server-only";
import { SUCCESS_MESSAGES } from "@/constants";
import { env } from "@/env.mjs";
import { NotAllowedError, UnexpectedError } from "@/error-classes";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import { hasDumperPostPermission } from "@/features/auth/utils/session";
import { minioClient } from "@/minio";
import type { ServerAction } from "@/types";
import sharp, { type Metadata } from "sharp";

type GenerateUrl = {
	url: string;
	metadata: Metadata;
};

export async function generateUrlWithMetadata(
	fileName: string,
): Promise<ServerAction<GenerateUrl>> {
	try {
		const hasPostPermission = await hasDumperPostPermission();
		if (!hasPostPermission) throw new NotAllowedError();

		const url = await minioClient.presignedGetObject(
			env.MINIO_BUCKET_NAME,
			fileName,
			24 * 60 * 60,
		);

		const response = await fetch(url);
		if (!response.ok) throw new UnexpectedError();

		const imageBuffer = await response.arrayBuffer();
		const metadata = await sharp(imageBuffer).metadata();

		return {
			success: true,
			message: SUCCESS_MESSAGES.INSERTED,
			data: { url, metadata },
		};
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
