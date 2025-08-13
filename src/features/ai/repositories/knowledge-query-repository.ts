import type { Books, Contents, Status } from "@/generated";
import prisma from "@/prisma";

type IKnowledgeQueryRepository = {
	findAllContents(
		userId: string,
		status: Status,
	): Promise<ContentsForKnowledge[]>;
	findAllBooks(userId: string, status: Status): Promise<BooksForKnowledge[]>;
};

type ContentsForKnowledge = Pick<Contents, "title" | "markdown">;
type BooksForKnowledge = Pick<Books, "title" | "markdown" | "ISBN">;

// FIXME: TODO: combine with other repositories
// FIXME: cache strategies

class KnowledgeQueryRepository implements IKnowledgeQueryRepository {
	async findAllContents(
		userId: string,
		status: Status,
	): Promise<ContentsForKnowledge[]> {
		return await prisma.contents.findMany({
			where: { userId, status },
			select: { title: true, markdown: true },
			cacheStrategy: { ttl: 400, tags: ["contents"] },
		});
	}

	async findAllBooks(
		userId: string,
		status: Status,
	): Promise<BooksForKnowledge[]> {
		return await prisma.books.findMany({
			where: { userId, status },
			select: { title: true, markdown: true, ISBN: true },
			cacheStrategy: { ttl: 400, tags: ["books"] },
		});
	}
}

export const knowledgeQueryRepository = new KnowledgeQueryRepository();
