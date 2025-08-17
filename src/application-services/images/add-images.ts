"use server";
import "server-only";
import { revalidateTag } from "next/cache";
import { withPermissionCheck } from "@/common/auth/permission-wrapper";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import type { ServerAction } from "@/common/types";
import { ImagesDomainService } from "@/domains/images/services/images-domain-service";
import { imagesCommandRepository } from "@/infrastructures/images/repositories/images-command-repository";
import { imagesQueryRepository } from "@/infrastructures/images/repositories/images-query-repository";

async function addImagesImpl(formData: FormData): Promise<ServerAction> {
	const userId = await getSelfId();

	const { validatedImages, thumbnailBuffer, originalBuffer } =
		await new ImagesDomainService(imagesQueryRepository).prepareNewImages(
			formData,
			userId,
		);

	await imagesCommandRepository.uploadToStorage(
		validatedImages.path,
		originalBuffer,
		false,
	);
	await imagesCommandRepository.uploadToStorage(
		validatedImages.path,
		thumbnailBuffer,
		true,
	);
	await imagesCommandRepository.create(validatedImages);

	revalidateTag(`images_UNEXPORTED_${userId}`);
	revalidateTag(`images_count_UNEXPORTED_${userId}`);

	return { success: true, message: "inserted" };
}

export const addImages = withPermissionCheck(
	hasDumperPostPermission,
	addImagesImpl,
);
