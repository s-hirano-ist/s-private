import { env } from "@/env";
import type { Images, Prisma, Status } from "@/generated";
import { minioClient } from "@/minio";
import prisma from "@/prisma";

export type IImageQueryRepository = {
	findById(id: string): Promise<Images | null>;
	findByIdAndUserId(id: string, userId: string): Promise<Images | null>;
	findMany(params?: ImageFindManyParams): Promise<Images[]>;
	findByStatus(status: Status, userId: string): Promise<Images[]>;
	findByStatusAndUserId(status: Status, userId: string): Promise<Images[]>;
	countAll(): Promise<number>;
	findAllPaginated(page: number, pageSize: number): Promise<Images[]>;
	getFromStorage(path: string): Promise<NodeJS.ReadableStream>;
};

type ImageFindManyParams = {
	where?: Prisma.ImagesWhereInput;
	orderBy?: Prisma.ImagesOrderByWithRelationInput;
	take?: number;
	skip?: number;
};

export class ImageQueryRepository implements IImageQueryRepository {
	async findById(id: string): Promise<Images | null> {
		return await prisma.images.findUnique({
			where: { id },
		});
	}

	async findByIdAndUserId(id: string, userId: string): Promise<Images | null> {
		return await prisma.images.findUnique({
			where: { id, userId },
		});
	}

	async findMany(params?: ImageFindManyParams): Promise<Images[]> {
		return await prisma.images.findMany(params);
	}

	async findByStatus(status: Status, userId: string): Promise<Images[]> {
		return await prisma.images.findMany({
			where: { status, userId },
			orderBy: { createdAt: "desc" },
		});
	}

	async findByStatusAndUserId(
		status: Status,
		userId: string,
	): Promise<Images[]> {
		return await prisma.images.findMany({
			where: { userId, status },
			orderBy: { id: "desc" },
		});
	}

	async countAll(): Promise<number> {
		return await prisma.images.count({});
	}

	async findAllPaginated(page: number, pageSize: number): Promise<Images[]> {
		return await prisma.images.findMany({
			orderBy: { id: "desc" },
			skip: (page - 1) * pageSize,
			take: pageSize,
			cacheStrategy: { ttl: 400, swr: 40, tags: ["images"] },
		});
	}

	async getFromStorage(path: string): Promise<NodeJS.ReadableStream> {
		return await minioClient.getObject(env.MINIO_BUCKET_NAME, path);
	}
}

export const imageQueryRepository = new ImageQueryRepository();
