import { cache } from "react";
import { contentsQueryRepository } from "@/features/contents/repositories/contents-query-repository";
import { getSelfId } from "@/utils/auth/session";

export const getAllContents = cache(contentsQueryRepository.findAll);

export const getContentsCount = cache(contentsQueryRepository.count);

export const getUnexportedContentsByUserId = cache(async () => {
	const userId = await getSelfId();
	return await contentsQueryRepository.findByStatusAndUserId(
		"UNEXPORTED",
		userId,
	);
});

export const getContentByTitle = cache(async (title: string) => {
	return await contentsQueryRepository.findByTitle(title);
});
