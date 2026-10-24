import type { IBooksCommandRepository } from "@s-hirano-ist/s-core/books/repositories/books-command-repository.interface";
import {
	buildContentCacheTag,
	buildCountCacheTag,
} from "@/infrastructures/shared/cache/cache-tag-builder";
import prisma from "@/prisma";
import { createBooksCommandRepository } from "@s-hirano-ist/s-backend/books/command-repository";
import { revalidateTag } from "next/cache";

const repository = createBooksCommandRepository(prisma);
/** Temporary Web cache adapter; persistence belongs to the backend. */
export const booksCommandRepository: IBooksCommandRepository = {
	async create(data) {
		await repository.create(data);
		revalidateTag(buildContentCacheTag("books", data.status, data.userId), {
			expire: 0,
		});
		revalidateTag(buildCountCacheTag("books", data.status, data.userId), {
			expire: 0,
		});
	},
	async deleteById(id, userId, status) {
		const result = await repository.deleteById(id, userId, status);
		revalidateTag(buildContentCacheTag("books", status, userId), { expire: 0 });
		revalidateTag(buildCountCacheTag("books", status, userId), { expire: 0 });
		return result;
	},
};
