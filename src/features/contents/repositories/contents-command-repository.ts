import type { Contents, Status } from "@/generated";
import prisma from "@/prisma";

type IContentsCommandRepository = {
	create(data: ContentsCreateInput): Promise<Contents>;
	deleteById(id: string, userId: string, status: Status): Promise<void>;
	transaction<T>(fn: () => Promise<T>): Promise<T>;
};

type ContentsCreateInput = {
	title: string;
	markdown: string;
	userId: string;
};

class ContentsCommandRepository implements IContentsCommandRepository {
	async create(data: ContentsCreateInput): Promise<Contents> {
		return await prisma.contents.create({ data });
	}

	async deleteById(id: string, userId: string, status: Status): Promise<void> {
		await prisma.contents.delete({ where: { id, userId, status } });
	}

	async transaction<T>(fn: () => Promise<T>): Promise<T> {
		return await prisma.$transaction(fn);
	}
}

export const contentsCommandRepository = new ContentsCommandRepository();
