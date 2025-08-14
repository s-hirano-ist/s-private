import type { Contents, Status } from "@/generated";
import prisma from "@/prisma";

type IContentsCommandRepository = {
	create(data: ContentsCreateInput): Promise<Contents>;
	deleteById(id: string, userId: string, status: Status): Promise<void>;
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
}

export const contentsCommandRepository = new ContentsCommandRepository();
