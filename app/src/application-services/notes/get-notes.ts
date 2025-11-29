import { unstable_cacheTag as cacheTag } from "next/cache";
import { cache } from "react";
import {
	makeStatus,
	type Status,
	type UserId,
} from "s-core/common/entities/common-entity";
import { makeNoteTitle } from "s-core/notes/entities/note-entity";
import type { CacheStrategy } from "s-core/notes/types/cache-strategy";
import { getSelfId } from "@/common/auth/session";
import { PAGE_SIZE } from "@/common/constants";
import type { GetCount, GetPaginatedData } from "@/common/types";
import { sanitizeCacheTag } from "@/common/utils/cache-utils";
import type { LinkCardStackInitialData } from "@/components/common/layouts/cards/types";
import { notesQueryRepository } from "@/infrastructures/notes/repositories/notes-query-repository";

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

export const getExportedNotesCount: GetCount = cache(
	async (): Promise<number> => {
		const userId = await getSelfId();
		return await _getNotesCount(userId, makeStatus("EXPORTED"));
	},
);

export const getUnexportedNotes: GetPaginatedData<LinkCardStackInitialData> =
	cache(async (currentCount: number) => {
		const userId = await getSelfId();
		return _getNotes(currentCount, userId, makeStatus("UNEXPORTED"));
	});

export const getExportedNotes: GetPaginatedData<LinkCardStackInitialData> =
	cache(async (currentCount: number) => {
		const userId = await getSelfId();
		return _getNotes(currentCount, userId, makeStatus("EXPORTED"), {
			ttl: 400,
			swr: 40,
			tags: [`${sanitizeCacheTag(userId)}_notes_${currentCount}`],
		});
	});

export const getNoteByTitle = cache(async (title: string) => {
	try {
		const userId = await getSelfId();
		return await notesQueryRepository.findByTitle(makeNoteTitle(title), userId);
	} catch (error) {
		throw error;
	}
});
