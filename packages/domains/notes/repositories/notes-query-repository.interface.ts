import type { Status, UserId } from "../../common/entities/common-entity";
import type { NoteTitle } from "../entities/note-entity";
import type { NotesFindManyParams } from "../types/query-params";

export type INotesQueryRepository = {
	findByTitle(
		title: NoteTitle,
		userId: UserId,
	): Promise<{
		id: string;
		title: string;
		markdown: string;
		status: string;
	} | null>;
	findMany(
		userId: UserId,
		status: Status,
		params: NotesFindManyParams,
	): Promise<Array<{ id: string; title: string }>>;
	count(userId: UserId, status: Status): Promise<number>;
	search(
		query: string,
		userId: UserId,
		limit?: number,
	): Promise<
		{
			id: string;
			title: string;
			markdown: string;
		}[]
	>;
};
