import type { Contents, Prisma, Status } from "@/generated";
import prisma from "@/prisma";

export type IContentsQueryRepository = {
	findById(id: number): Promise<Contents | null>;
	findMany(params?: ContentsFindManyParams): Promise<Contents[]>;
	findByStatus(status: Status, userId: string): Promise<Contents[]>;
	findByStatusAndUserId(status: Status, userId: string): Promise<Contents[]>;
	findByTitle(title: string): Promise<Contents | null>;
	findAll(): Promise<ContentsWithImage[]>;
	count(): Promise<number>;
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

export class ContentsQueryRepository implements IContentsQueryRepository {
	async findById(id: number): Promise<Contents | null> {
		return await prisma.contents.findUnique({
			where: { id },
		});
	}

	async findMany(params?: ContentsFindManyParams): Promise<Contents[]> {
		return await prisma.contents.findMany(params);
	}

	async findByStatus(status: Status, userId: string): Promise<Contents[]> {
		return await prisma.contents.findMany({
			where: { status, userId },
			orderBy: { createdAt: "desc" },
		});
	}

	async findByStatusAndUserId(status: Status, userId: string): Promise<Contents[]> {
		return await prisma.contents.findMany({
			where: { status, userId },
			orderBy: { title: "desc" },
		});
	}

	async findByTitle(title: string): Promise<Contents | null> {
		return await prisma.contents.findUnique({
			where: { title },
			cacheStrategy: { ttl: 400, tags: ["contents"] },
		});
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

export const contentsQueryRepository = new ContentsQueryRepository();