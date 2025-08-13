import { cache } from "react";
import { PAGE_SIZE } from "@/constants";
import { imageQueryRepository } from "@/features/images/repositories/image-query-repository";
import { Status } from "@/generated";
import { getSelfId } from "@/utils/auth/session";

export const getExportedImages = cache(async (page: number) => {
	const userId = await getSelfId();
	return await imageQueryRepository.findMany(userId, "EXPORTED", {
		skip: (page - 1) * PAGE_SIZE,
		take: PAGE_SIZE,
		orderBy: { createdAt: "desc" },
		cacheStrategy: { ttl: 400, swr: 40, tags: ["images"] },
	});
});

export const getUnexportedImages = cache(async () => {
	const userId = await getSelfId();
	return await imageQueryRepository.findMany(userId, "UNEXPORTED", {
		orderBy: { createdAt: "desc" },
	});
});

export const getImagesCount = cache(async (status: Status) => {
	const userId = await getSelfId();
	return await imageQueryRepository.count(userId, status);
});

export const getImageFromStorage = async (objKey: string) => {
	return await imageQueryRepository.getFromStorage(objKey);
};
