/**
 * Note query application services.
 *
 * @remarks
 * Provides cached data access for notes with pagination support.
 * Uses Next.js cache tags for efficient cache invalidation.
 *
 * @module
 */

import {
	makeExportedStatus,
	makeUnexportedStatus,
	type Status,
	type UserId,
} from "@s-hirano-ist/s-core/common/entities/common-entity";
import { makeNoteTitle } from "@s-hirano-ist/s-core/notes/entities/note-entity";
import type { CacheStrategy } from "@s-hirano-ist/s-core/notes/types/cache-strategy";
import { unstable_cacheTag as cacheTag } from "next/cache";
import { cache } from "react";
import { getSelfId } from "@/common/auth/session";
import { PAGE_SIZE } from "@/common/constants";
import type { GetCount, GetPaginatedData } from "@/common/types";
import { sanitizeCacheTag } from "@/common/utils/cache-utils";
import type { LinkCardStackInitialData } from "@/components/common/layouts/cards/types";
import { notesQueryRepository } from "@/infrastructures/notes/repositories/notes-query-repository";

/**
 * Fetches paginated notes with cache support.
 *
 * @param currentCount - Number of items to skip (offset)
 * @param userId - User ID for data isolation
 * @param status - Note status filter (UNEXPORTED/EXPORTED)
 * @param cacheStrategy - Optional Prisma Accelerate cache configuration
 * @returns Paginated note data with total count
 *
 * @internal
 */
export const _getNotes = async (
	currentCount: number,
	userId: UserId,
	status: Status,
	cacheStrategy?: CacheStrategy,
): Promise<LinkCardStackInitialData> => {
	"use cache";
	cacheTag(
		`notes_${status}_${userId}`,
		`notes_${status}_${userId}_${currentCount}`,
	);
	try {
		const notes = await notesQueryRepository.findMany(userId, status, {
			skip: currentCount,
			take: PAGE_SIZE,
			orderBy: { createdAt: "desc" },
			cacheStrategy,
		});

		const totalCount = await _getNotesCount(userId, status);

		return {
			data: notes.map((d) => ({
				id: d.id,
				key: d.id,
				title: d.title,
				description: "",
				href: `/note/${encodeURIComponent(d.title)}`,
			})),
			totalCount,
		};
	} catch (error) {
		throw error;
	}
};

/**
 * Gets total count of notes for a user and status.
 *
 * @internal
 */
const _getNotesCount = async (
	userId: UserId,
	status: Status,
): Promise<number> => {
	"use cache";
	cacheTag(`notes_count_${status}_${userId}`);
	try {
		return await notesQueryRepository.count(userId, status);
	} catch (error) {
		throw error;
	}
};

/**
 * Gets the total count of exported notes for the current user.
 */
export const getExportedNotesCount: GetCount = cache(
	async (): Promise<number> => {
		const userId = await getSelfId();
		return await _getNotesCount(userId, makeExportedStatus().status);
	},
);

/**
 * Fetches paginated unexported notes for the current user.
 */
export const getUnexportedNotes: GetPaginatedData<LinkCardStackInitialData> =
	cache(async (currentCount: number) => {
		const userId = await getSelfId();
		return _getNotes(currentCount, userId, makeUnexportedStatus());
	});

/**
 * Fetches paginated exported notes for the current user.
 *
 * @remarks
 * Uses Prisma Accelerate caching with TTL and SWR for viewer performance.
 */
export const getExportedNotes: GetPaginatedData<LinkCardStackInitialData> =
	cache(async (currentCount: number) => {
		const userId = await getSelfId();
		return _getNotes(currentCount, userId, makeExportedStatus().status, {
			ttl: 400,
			swr: 40,
			tags: [`${sanitizeCacheTag(userId)}_notes_${currentCount}`],
		});
	});

/**
 * Fetches a single note by its title.
 *
 * @param title - Note title to search for
 * @returns Note data or null if not found
 */
export const getNoteByTitle = cache(async (title: string) => {
	try {
		const userId = await getSelfId();
		return await notesQueryRepository.findByTitle(makeNoteTitle(title), userId);
	} catch (error) {
		throw error;
	}
});
