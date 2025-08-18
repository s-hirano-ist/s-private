import type { Status, UserId } from "@/domains/common/entities/common-entity";
import type { ContentTitle } from "@/domains/contents/entities/contents-entity";
import type {
	ContentsFindManyParams,
	IContentsQueryRepository,
} from "@/domains/contents/types";
import prisma from "@/prisma";

class ContentsQueryRepository implements IContentsQueryRepository {
	async findByTitle(
		title: ContentTitle,
		userId: UserId,
	): Promise<{ id: string; title: string; markdown: string } | null> {
		return await prisma.contents.findUnique({
			where: { title_userId: { title, userId } },
			select: { id: true, title: true, markdown: true },
		});
	}

	async findMany(
		userId: UserId,
		status: Status,
		params: ContentsFindManyParams,
	): Promise<Array<{ id: string; title: string }>> {
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
