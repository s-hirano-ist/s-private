import type { Contents, Prisma, Status } from "@/generated";
import prisma from "@/prisma";

export type IContentsRepository = {
	create(data: ContentsCreateInput): Promise<Contents>;
	findById(id: number): Promise<Contents | null>;
	findMany(params?: ContentsFindManyParams): Promise<Contents[]>;
	updateStatus(id: number, status: Status): Promise<Contents>;
	updateManyStatus(
		userId: string,
		fromStatus: Status,
		toStatus: Status,
	): Promise<number>;
	delete(id: number): Promise<void>;
	findByStatus(status: Status, userId: string): Promise<Contents[]>;
	transaction<T>(fn: () => Promise<T>): Promise<T>;
	findAll(): Promise<ContentsWithImage[]>;
	count(): Promise<number>;
};

type ContentsCreateInput = {
	title: string;
	markdown: string;
	userId: string;
};

type ContentsFindManyParams = {
	where?: Prisma.ContentsWhereInput;
	orderBy?: Prisma.ContentsOrderByWithRelationInput;
	take?: number;
	skip?: number;
};

type ContentsWithImage = {
	id: number;
	title: string;
	description?: string;
	href: string;
};

export class ContentsRepository implements IContentsRepository {
	async create(data: ContentsCreateInput): Promise<Contents> {
		return await prisma.contents.create({ data });
	}

	async findById(id: number): Promise<Contents | null> {
		return await prisma.contents.findUnique({
			where: { id },
		});
	}

	async findMany(params?: ContentsFindManyParams): Promise<Contents[]> {
		return await prisma.contents.findMany(params);
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

	async findByStatus(status: Status, userId: string): Promise<Contents[]> {
		return await prisma.contents.findMany({
			where: { status, userId },
			orderBy: { createdAt: "desc" },
		});
	}

	async transaction<T>(fn: () => Promise<T>): Promise<T> {
		return await prisma.$transaction(fn);
	}

	findAll = async (): Promise<ContentsWithImage[]> => {
		const contents = await prisma.contents.findMany({
			select: { title: true, id: true, markdown: true },
			cacheStrategy: { ttl: 400, tags: ["contents"] },
		});

		return contents.map((content) => ({
			id: content.id,
			title: content.title,
			description: content.markdown,
			href: `/content/${content.title}`,
		})) satisfies ContentsWithImage[];
	};

	count = async (): Promise<number> => {
		return await prisma.contents.count({});
	};
}

export const contentsRepository = new ContentsRepository();
