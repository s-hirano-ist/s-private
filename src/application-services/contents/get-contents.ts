import { unstable_cacheTag as cacheTag } from "next/cache";
import { cache } from "react";
import { getSelfId } from "@/common/auth/session";
import { PAGE_SIZE } from "@/common/constants";
import { sanitizeCacheTag } from "@/common/utils/cache-utils";
import { LinkCardStackInitialData } from "@/components/common/layouts/cards/types";
import type { Status } from "@/domains/common/entities/common-entity";
import { CacheStrategy } from "@/domains/contents/types";
import { contentsQueryRepository } from "@/infrastructures/contents/repositories/contents-query-repository";

export const _getContents = async (
	currentCount: number,
	userId: string,
	status: Status,
	cacheStrategy?: CacheStrategy,
): Promise<LinkCardStackInitialData> => {
	"use cache";
	cacheTag(
		`contents_${status}_${userId}`,
		`contents_${status}_${userId}_${currentCount}`,
	);
	try {
		const contents = await contentsQueryRepository.findMany(userId, status, {
			skip: currentCount,
			take: PAGE_SIZE,
			orderBy: { createdAt: "desc" },
			cacheStrategy,
		});

		const totalCount = await _getContentsCount(userId, status);

		return {
			data: contents.map((d) => ({
				id: d.id,
				key: d.id,
				title: d.title,
				description: "",
				href: `/content/${encodeURIComponent(d.title)}`,
			})),
			totalCount,
		};
	} catch (error) {
		throw error;
	}
};

const _getContentsCount = async (
	userId: string,
	status: Status,
): Promise<number> => {
	"use cache";
	cacheTag(`contents_count_${status}_${userId}`);
	try {
		return await contentsQueryRepository.count(userId, status);
	} catch (error) {
		throw error;
	}
};

export type GetContentsCount = () => Promise<number>;

export const getUnexportedContentsCount: GetContentsCount = cache(
	async (): Promise<number> => {
		const userId = await getSelfId();
		return await _getContentsCount(userId, "UNEXPORTED");
	},
);

export const getExportedContentsCount: GetContentsCount = cache(
	async (): Promise<number> => {
		const userId = await getSelfId();
		return await _getContentsCount(userId, "EXPORTED");
	},
);

export type GetContents = (_: number) => Promise<LinkCardStackInitialData>;

export const getUnexportedContents: GetContents = cache(
	async (currentCount: number) => {
		const userId = await getSelfId();
		return _getContents(currentCount, userId, "UNEXPORTED");
	},
);

export const getExportedContents: GetContents = cache(
	async (currentCount: number) => {
		const userId = await getSelfId();
		return _getContents(currentCount, userId, "EXPORTED", {
			ttl: 400,
			swr: 40,
			tags: [`${sanitizeCacheTag(userId)}_contents_${currentCount}`],
		});
	},
);

export const getContentByTitle = cache(async (title: string) => {
	try {
		const userId = await getSelfId();
		return await contentsQueryRepository.findByTitle(title, userId);
	} catch (error) {
		throw error;
	}
});
