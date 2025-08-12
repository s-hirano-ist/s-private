import { env } from "@/env";
import type { Images, Prisma, Status } from "@/generated";
import { minioClient } from "@/minio";
import prisma from "@/prisma";

export type IImageRepository = {
	create(data: ImageCreateInput): Promise<Images>;
	findById(id: string): Promise<Images | null>;
	findByIdAndUserId(id: string, userId: string): Promise<Images | null>;
	findMany(params?: ImageFindManyParams): Promise<Images[]>;
	updateStatus(id: string, status: Status): Promise<Images>;
	updateManyStatus(
		userId: string,
		fromStatus: Status,
		toStatus: Status,
	): Promise<number>;
	delete(id: string): Promise<void>;
	findByStatus(status: Status, userId: string): Promise<Images[]>;
	invalidateCache(): Promise<void>;
	uploadToStorage(path: string, buffer: Buffer): Promise<void>;
	getFromStorage(path: string): Promise<NodeJS.ReadableStream>;
	transaction<T>(fn: () => Promise<T>): Promise<T>;
};

type ImageCreateInput = {
	id: string;
	userId: string;
	contentType: string;
	fileSize?: number | null;
	width?: number | null;
	height?: number | null;
	tags?: string[];
	description?: string | null;
};

type ImageFindManyParams = {
	where?: Prisma.ImagesWhereInput;
	orderBy?: Prisma.ImagesOrderByWithRelationInput;
	take?: number;
	skip?: number;
};

export class ImageRepository implements IImageRepository {
	async create(data: ImageCreateInput): Promise<Images> {
		return await prisma.images.create({
			data,
		});
	}

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

	async updateStatus(id: string, status: Status): Promise<Images> {
		return await prisma.images.update({
			where: { id },
			data: { status },
		});
	}

	async updateManyStatus(
		userId: string,
		fromStatus: Status,
		toStatus: Status,
	): Promise<number> {
		const result = await prisma.images.updateMany({
			where: { status: fromStatus, userId },
			data: { status: toStatus },
		});
		return result.count;
	}

	async delete(id: string): Promise<void> {
		await prisma.images.delete({
			where: { id },
		});
	}

	async findByStatus(status: Status, userId: string): Promise<Images[]> {
		return await prisma.images.findMany({
			where: { status, userId },
			orderBy: { createdAt: "desc" },
		});
	}

	async invalidateCache(): Promise<void> {
		await prisma.$accelerate.invalidate({ tags: ["images"] });
	}

	async uploadToStorage(path: string, buffer: Buffer): Promise<void> {
		await minioClient.putObject(env.MINIO_BUCKET_NAME, path, buffer);
	}

	async getFromStorage(path: string): Promise<NodeJS.ReadableStream> {
		return await minioClient.getObject(env.MINIO_BUCKET_NAME, path);
	}

	async transaction<T>(fn: () => Promise<T>): Promise<T> {
		return await prisma.$transaction(fn);
	}
}

export const imageRepository = new ImageRepository();
