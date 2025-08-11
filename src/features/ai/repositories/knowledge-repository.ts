import { cache } from "react";
import type { StaticBooks, StaticContents } from "@/generated";
import prisma from "@/prisma";

export type IKnowledgeRepository = {
	findAllStaticContents(): Promise<StaticContentsForKnowledge[]>;
	findAllStaticBooks(): Promise<StaticBooksForKnowledge[]>;
	findStaticContentByTitle(
		title: string,
	): Promise<StaticContentsForKnowledge | null>;
};

type StaticContentsForKnowledge = Pick<StaticContents, "title" | "markdown">;
type StaticBooksForKnowledge = Pick<StaticBooks, "title" | "markdown" | "ISBN">;

export class KnowledgeRepository implements IKnowledgeRepository {
	private _findAllStaticContents = async (): Promise<
		StaticContentsForKnowledge[]
	> => {
		return await prisma.staticContents.findMany({
			select: { title: true, markdown: true },
			cacheStrategy: { ttl: 400, tags: ["staticContents"] },
		});
	};

	private _findAllStaticBooks = async (): Promise<
		StaticBooksForKnowledge[]
	> => {
		return await prisma.staticBooks.findMany({
			select: { title: true, markdown: true, ISBN: true },
			cacheStrategy: { ttl: 400, tags: ["staticBooks"] },
		});
	};

	findAllStaticContents = cache(this._findAllStaticContents);
	findAllStaticBooks = cache(this._findAllStaticBooks);

	async findStaticContentByTitle(
		title: string,
	): Promise<StaticContentsForKnowledge | null> {
		return await prisma.staticContents.findUnique({
			where: { title },
			select: { title: true, markdown: true },
			cacheStrategy: { ttl: 400, tags: ["staticContents"] },
		});
	}
}

export const knowledgeRepository = new KnowledgeRepository();
