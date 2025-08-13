import { cache } from "react";
import { imageQueryRepository } from "@/features/images/repositories/image-query-repository";
import { getSelfId } from "@/utils/auth/session";

export const getUnexportedImagesByUserId = cache(async () => {
	const userId = await getSelfId();
	return await imageQueryRepository.findByStatusAndUserId("UNEXPORTED", userId);
});

export const getAllImagesPaginated = cache(
	async (page: number, pageSize: number) => {
		return await imageQueryRepository.findAllPaginated(page, pageSize);
	},
);

export const getImagesCount = cache(async () => {
	return await imageQueryRepository.count();
});

export const getAllImagesCount = cache(async () => {
	return await imageQueryRepository.countAll();
});

export const getImageFromStorage = async (objKey: string) => {
	return await imageQueryRepository.getFromStorage(objKey);
};
