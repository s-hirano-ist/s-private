import { unstable_cache } from "next/cache";
import { cache } from "react";
import { getSelfId } from "@/common/auth/session";
import { PAGE_SIZE } from "@/common/constants";
import { LinkCardData } from "@/components/common/layouts/cards/link-card";
import type { Status } from "@/domains/common/entities/common-entity";
import { contentsQueryRepository } from "@/infrastructures/contents/repositories/contents-query-repository";

const _getExportedContents = async (): Promise<LinkCardData[]> => {
	try {
		const userId = await getSelfId();
		const contents = await contentsQueryRepository.findMany(
			userId,
			"EXPORTED",
			{
				orderBy: { createdAt: "desc" },
				cacheStrategy: { ttl: 400, swr: 40, tags: ["contents"] },
			},
		);

		return contents.map((d) => ({
			id: d.id,
			key: d.id,
			title: d.title,
			description: "",
			href: `/content/${encodeURIComponent(d.title)}`,
		}));
	} catch (error) {
		throw error;
	}
};

export const getExportedContents = unstable_cache(
	_getExportedContents,
	["contents-exported"],
	{ tags: ["contents-exported"], revalidate: 400 },
);

const _getUnexportedContents = async (): Promise<LinkCardData[]> => {
	try {
		const userId = await getSelfId();
		const contents = await contentsQueryRepository.findMany(
			userId,
			"UNEXPORTED",
			{ orderBy: { createdAt: "desc" } },
		);
		return contents.map((d) => ({
			id: d.id,
			key: d.id,
			title: d.title,
			description: "",
			href: `/content/${encodeURIComponent(d.title)}`,
		}));
	} catch (error) {
		throw error;
	}
};

export const getUnexportedContents = unstable_cache(
	_getUnexportedContents,
	["contents-unexported"],
	{ tags: ["contents-unexported"], revalidate: 300 },
);

const _getContentsCount = async (
	status: Status,
): Promise<{ count: number; pageSize: number }> => {
	try {
		const userId = await getSelfId();
		return {
			count: await contentsQueryRepository.count(userId, status),
			pageSize: PAGE_SIZE,
		};
	} catch (error) {
		throw error;
	}
};

export const getContentsCount = (status: Status) =>
	unstable_cache(
		() => _getContentsCount(status),
		[`contents-count-${status}`],
		{ tags: [`contents-count-${status}`], revalidate: 60 },
	)();

export const getContentByTitle = cache(async (title: string) => {
	try {
		const userId = await getSelfId();
		return await contentsQueryRepository.findByTitle(title, userId);
	} catch (error) {
		throw error;
	}
});
