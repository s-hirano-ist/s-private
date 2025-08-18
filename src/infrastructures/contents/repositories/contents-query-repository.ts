import type { Status, UserId } from "@/domains/common/entities/common-entity";
import type { ContentTitle } from "@/domains/contents/entities/contents-entity";
import type { IContentsQueryRepository } from "@/domains/contents/repositories/contents-query-repository.interface";
import type { ContentsFindManyParams } from "@/domains/contents/types/query-params";
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
