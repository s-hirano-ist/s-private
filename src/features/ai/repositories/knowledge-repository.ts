import { cache } from "react";
import type { Books, Contents } from "@/generated";
import prisma from "@/prisma";

export type IKnowledgeRepository = {
	findAllContents(): Promise<ContentsForKnowledge[]>;
	findAllBooks(): Promise<BooksForKnowledge[]>;
	findContentByTitle(title: string): Promise<ContentsForKnowledge | null>;
};

type ContentsForKnowledge = Pick<Contents, "title" | "markdown">;
type BooksForKnowledge = Pick<Books, "title" | "markdown" | "ISBN">;

export class KnowledgeRepository implements IKnowledgeRepository {
	private _findAllContents = async (): Promise<ContentsForKnowledge[]> => {
		return await prisma.contents.findMany({
			select: { title: true, markdown: true },
			cacheStrategy: { ttl: 400, tags: ["contents"] },
		});
	};

	private _findAllBooks = async (): Promise<BooksForKnowledge[]> => {
		return await prisma.books.findMany({
			select: { title: true, markdown: true, ISBN: true },
			cacheStrategy: { ttl: 400, tags: ["books"] },
		});
	};

	findAllContents = cache(this._findAllContents);
	findAllBooks = cache(this._findAllBooks);

	async findContentByTitle(
		title: string,
	): Promise<ContentsForKnowledge | null> {
		return await prisma.contents.findUnique({
			where: { title },
			select: { title: true, markdown: true },
			cacheStrategy: { ttl: 400, tags: ["contents"] },
		});
	}
}

export const knowledgeRepository = new KnowledgeRepository();
