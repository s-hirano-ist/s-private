import type { Contents, Status } from "@/generated";
import prisma from "@/prisma";

export type IContentsCommandRepository = {
	create(data: ContentsCreateInput): Promise<Contents>;
	updateStatus(id: number, status: Status): Promise<Contents>;
	updateManyStatus(
		userId: string,
		fromStatus: Status,
		toStatus: Status,
	): Promise<number>;
	delete(id: number): Promise<void>;
	transaction<T>(fn: () => Promise<T>): Promise<T>;
};

type ContentsCreateInput = {
	title: string;
	markdown: string;
	userId: string;
};

export class ContentsCommandRepository implements IContentsCommandRepository {
	async create(data: ContentsCreateInput): Promise<Contents> {
		return await prisma.contents.create({ data });
	}

	async updateStatus(id: number, status: Status): Promise<Contents> {
		return await prisma.contents.update({
			where: { id },
			data: { status },
		});
	}

	async updateManyStatus(
		userId: string,
		fromStatus: Status,
		toStatus: Status,
	): Promise<number> {
		const result = await prisma.contents.updateMany({
			where: { status: fromStatus, userId },
			data: { status: toStatus },
		});
		return result.count;
	}

	async delete(id: number): Promise<void> {
		await prisma.contents.delete({
			where: { id },
		});
	}

	async transaction<T>(fn: () => Promise<T>): Promise<T> {
		return await prisma.$transaction(fn);
	}
}

export const contentsCommandRepository = new ContentsCommandRepository();