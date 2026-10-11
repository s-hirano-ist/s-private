import type { INotesCommandRepository } from "@s-hirano-ist/s-core/notes/repositories/notes-command-repository.interface";
import {
	buildContentCacheTag,
	buildCountCacheTag,
} from "@/infrastructures/shared/cache/cache-tag-builder";
import prisma from "@/prisma";
import { createNotesCommandRepository } from "@s-hirano-ist/s-backend/notes/command-repository";
import { revalidateTag } from "next/cache";

const repository = createNotesCommandRepository(prisma);
/** Temporary Web cache adapter; persistence belongs to the backend. */
export const notesCommandRepository: INotesCommandRepository = {
	async create(data) {
		await repository.create(data);
		revalidateTag(buildContentCacheTag("notes", data.status, data.userId), {
			expire: 0,
		});
		revalidateTag(buildCountCacheTag("notes", data.status, data.userId), {
			expire: 0,
		});
	},
	async deleteById(id, userId, status) {
		const result = await repository.deleteById(id, userId, status);
		revalidateTag(buildContentCacheTag("notes", status, userId), { expire: 0 });
		revalidateTag(buildCountCacheTag("notes", status, userId), { expire: 0 });
		return result;
	},
};
