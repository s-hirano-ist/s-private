import { cache } from "react";
import { getSelfId } from "@/common/auth/session";
import { LinkCardData } from "@/common/components/card/link-card";
import type { Status } from "@/domains/common/entities/common-entity";
import { contentsQueryRepository } from "@/infrastructures/contents/repositories/contents-query-repository";

export const getExportedContents = cache(async (): Promise<LinkCardData[]> => {
	const userId = await getSelfId();
	const contents = await contentsQueryRepository.findMany(userId, "EXPORTED", {
		orderBy: { createdAt: "desc" },
		cacheStrategy: { ttl: 400, swr: 40, tags: ["contents"] },
	});

	return contents.map((d) => ({
		id: "",
		key: d.id,
		title: d.title,
		description: "",
		href: `/content/${encodeURIComponent(d.title)}`,
	}));
});

export const getUnexportedContents = cache(
	async (): Promise<LinkCardData[]> => {
		const userId = await getSelfId();
		const contents = await contentsQueryRepository.findMany(
			userId,
			"UNEXPORTED",
			{ orderBy: { createdAt: "desc" } },
		);
		return contents.map((d) => ({
			id: "",
			key: d.id,
			title: d.title,
			description: "",
			href: `/content/${encodeURIComponent(d.title)}`,
		}));
	},
);

export const getContentsCount = cache(async (status: Status) => {
	const userId = await getSelfId();
	return await contentsQueryRepository.count(userId, status);
});

export const getContentByTitle = cache(async (title: string) => {
	const userId = await getSelfId();
	return await contentsQueryRepository.findByTitle(title, userId);
});
