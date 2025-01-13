"use server";
import "server-only";
import { SUCCESS_MESSAGES } from "@/constants";
import { env } from "@/env.mjs";
import {
	FileNotAllowedError,
	NotAllowedError,
	UnexpectedError,
} from "@/error-classes";
import { wrapServerSideErrorForClient } from "@/error-wrapper";
import { getSelfId, hasDumperPostPermission } from "@/features/auth/utils/role";
import { minioClient } from "@/minio";
import { loggerInfo } from "@/pino";
import prisma from "@/prisma";
import type { ServerAction } from "@/types";
import { sendLineNotifyMessage } from "@/utils/fetch-message";
import { formatCreateImageMessage } from "@/utils/format-for-line";
import { sanitizeFileName } from "@/utils/sanitize-file-name";
import { revalidatePath } from "next/cache";
import { v7 as uuidv7 } from "uuid";

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
		if (!allowedMimeTypes.includes(file.type)) throw new FileNotAllowedError();
		if (file.size > maxFileSize) throw new FileNotAllowedError();

		const buffer = Buffer.from(await file.arrayBuffer());
		const sanitizedFileName = sanitizeFileName(file.name);

		const id = `${uuidv7()}-${sanitizedFileName}`;

		await minioClient.putObject(env.MINIO_BUCKET_NAME, id, buffer);

		const createdImage = await prisma.images.create({
			data: { id, userId },
			select: { id: true },
		});
		const message = formatCreateImageMessage({
			fileName: createdImage.id,
		});
		loggerInfo(message, {
			caller: "addImage",
			status: 200,
		});
		await sendLineNotifyMessage(message);
		revalidatePath("/(dumper)");

		return {
			success: true,
			message: SUCCESS_MESSAGES.INSERTED,
			data: undefined,
		};
	} catch (error) {
		return await wrapServerSideErrorForClient(error);
	}
}
