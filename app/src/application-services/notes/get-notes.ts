/**
 * Note query application services.
 *
 * @remarks
 * Provides cached data access for notes with pagination support.
 * Uses Next.js cache tags for efficient cache invalidation.
 *
 * @module
 */

import { makeNoteTitle } from "@s-hirano-ist/s-core/notes/entities/note-entity";
import {
	makeExportedStatus,
	makeUnexportedStatus,
	type Status,
	type UserId,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import { cacheTag } from "next/cache";
import { cache } from "react";
import { getSelfId } from "@/common/auth/session";
import { PAGE_SIZE } from "@/common/constants";
import type { GetCount, GetPaginatedData } from "@/common/types";
import type { LinkCardStackInitialData } from "@/components/common/layouts/cards/types";
import { notesQueryRepository } from "@/infrastructures/notes/repositories/notes-query-repository";
import {
	buildContentCacheTag,
	buildCountCacheTag,
	buildPaginatedContentCacheTag,
} from "@/infrastructures/shared/cache/cache-tag-builder";

/**
 * Fetches paginated notes with cache support.
 *
 * @param currentCount - Number of items to skip (offset)
 * @param userId - User ID for data isolation
 * @param status - Note status filter (UNEXPORTED/EXPORTED)
 * @returns Paginated note data with total count
 *
 * @internal
 */
const _getNotes = async (
	currentCount: number,
	userId: UserId,
	status: Status,
): Promise<LinkCardStackInitialData> => {
	"use cache";
	cacheTag(
		buildContentCacheTag("notes", status, userId),
		buildPaginatedContentCacheTag("notes", status, userId, currentCount),
	);
	const [notes, totalCount] = await Promise.all([
		notesQueryRepository.findMany(userId, status, {
			skip: currentCount,
			take: PAGE_SIZE,
			orderBy: { createdAt: "desc" },
		}),
		_getNotesCount(userId, status),
	]);

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
	cacheTag(buildCountCacheTag("notes", status, userId));
	return await notesQueryRepository.count(userId, status);
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
 */
export const getExportedNotes: GetPaginatedData<LinkCardStackInitialData> =
	cache(async (currentCount: number) => {
		const userId = await getSelfId();
		return _getNotes(currentCount, userId, makeExportedStatus().status);
	});

/**
 * Fetches a single note by its title.
 *
 * @param title - Note title to search for
 * @returns Note data or null if not found
 */
export const getNoteByTitle = cache(async (title: string) => {
	const userId = await getSelfId();
	return await notesQueryRepository.findByTitle(makeNoteTitle(title), userId);
});
