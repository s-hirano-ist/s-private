import type {
	Contents,
	ContentsFindManyParams,
	ContentsList,
	IContentsQueryRepository,
} from "@/domains/contents/types";
import type { Status } from "@/generated";
import prisma from "@/prisma";

class ContentsQueryRepository implements IContentsQueryRepository {
	async findByTitle(title: string, userId: string): Promise<Contents | null> {
		return await prisma.contents.findUnique({
			where: { title_userId: { title, userId } },
			select: { id: true, title: true, markdown: true },
		});
	}

	async findMany(
		userId: string,
		status: Status,
		params?: ContentsFindManyParams,
	): Promise<ContentsList> {
		return await prisma.contents.findMany({
			where: { userId, status },
			select: { id: true, title: true },
			...params,
		});
	}

	async count(userId: string, status: Status): Promise<number> {
		return await prisma.contents.count({ where: { userId, status } });
	}
}

export const contentsQueryRepository = new ContentsQueryRepository();
