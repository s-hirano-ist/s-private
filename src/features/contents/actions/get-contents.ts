import { cache } from "react";
import { contentsQueryRepository } from "@/features/contents/repositories/contents-query-repository";
import { Status } from "@/generated";
import { getSelfId } from "@/utils/auth/session";

export const getExportedContents = cache(async () => {
	const userId = await getSelfId();
	const contents = await contentsQueryRepository.findMany(userId, "EXPORTED", {
		orderBy: { createdAt: "desc" },
		cacheStrategy: { ttl: 400, swr: 40, tags: ["contents"] },
	});

	return contents.map((d) => ({
		id: d.id,
		title: d.title,
		description: "",
		href: `/content/${d.title}`,
		// FIXME: TODO: href: `/content/${encodeURIComponent(content.title)}`,
	}));
});

export const getUnexportedContents = cache(async () => {
	const userId = await getSelfId();
	const contents = await contentsQueryRepository.findMany(
		userId,
		"UNEXPORTED",
		{ orderBy: { createdAt: "desc" } },
	);
	return contents.map((d) => ({
		id: d.id,
		title: d.title,
		description: "",
		href: `/content/${d.title}`,
		// FIXME: TODO: href: `/content/${encodeURIComponent(content.title)}`,
	}));
});

export const getContentsCount = cache(async (status: Status) => {
	const userId = await getSelfId();
	return await contentsQueryRepository.count(userId, status);
});

export const getContentByTitle = cache(async (title: string) => {
	const userId = await getSelfId();
	return await contentsQueryRepository.findByTitle(title, userId, "EXPORTED");
});
