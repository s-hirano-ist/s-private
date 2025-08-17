"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { getSelfId, hasDumperPostPermission } from "@/common/auth/session";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";
import { ImagesDomainService } from "@/domains/images/services/images-domain-service";
import { imagesCommandRepository } from "@/infrastructures/images/repositories/images-command-repository";
import { imagesQueryRepository } from "@/infrastructures/images/repositories/images-query-repository";

export async function addImages(formData: FormData): Promise<ServerAction> {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) forbidden();

	try {
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

		revalidatePath("/(dumper)");

		return { success: true, message: "inserted" };
	} catch (error) {
		return await wrapServerSideErrorForClient(error, formData);
	}
}
