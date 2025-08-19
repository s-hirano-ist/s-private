"use server";
import "server-only";
import { revalidateTag } from "next/cache";
import { forbidden } from "next/navigation";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import {
	buildContentCacheTag,
	buildCountCacheTag,
} from "@/common/utils/cache-tag-builder";
import { makeStatus } from "@/domains/common/entities/common-entity";
import { imageEntity } from "@/domains/images/entities/image-entity";
import { imagesCommandRepository } from "@/infrastructures/images/repositories/images-command-repository";
import { parseAddImageFormData } from "./helpers/form-data-parser";

export async function addImage(formData: FormData): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	try {
		const {
			userId,
			path,
			contentType,
			fileSize,
			thumbnailBuffer,
			originalBuffer,
		} = await parseAddImageFormData(formData, await getSelfId());

		const image = imageEntity.create({
			userId,
			path,
			contentType,
			fileSize,
		});

		await imagesCommandRepository.uploadToStorage(
			image.path,
			originalBuffer,
			false,
		);
		await imagesCommandRepository.uploadToStorage(
			image.path,
			thumbnailBuffer,
			true,
		);
		await imagesCommandRepository.create(image);

		const status = makeStatus("UNEXPORTED");
		revalidateTag(buildContentCacheTag("images", status, userId));
		revalidateTag(buildCountCacheTag("images", status, userId));

		return { success: true, message: "inserted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error, formData);
	}
}
