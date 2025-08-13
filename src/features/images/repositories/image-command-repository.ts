import { env } from "@/env";
import type { Images, Status } from "@/generated";
import { minioClient } from "@/minio";
import prisma from "@/prisma";

type IImageCommandRepository = {
	create(data: ImageCreateInput): Promise<Images>;
	deleteById(id: string, userId: string, status: Status): Promise<void>;
	transaction<T>(fn: () => Promise<T>): Promise<T>;
	invalidateCache(): Promise<void>;
	uploadToStorage(path: string, buffer: Buffer): Promise<void>;
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

class ImageCommandRepository implements IImageCommandRepository {
	async create(data: ImageCreateInput): Promise<Images> {
		return await prisma.images.create({ data });
	}

	async deleteById(id: string, userId: string, status: Status): Promise<void> {
		await prisma.images.delete({ where: { id, userId, status } });
	}

	async transaction<T>(fn: () => Promise<T>): Promise<T> {
		return await prisma.$transaction(fn);
	}

	async invalidateCache(): Promise<void> {
		await prisma.$accelerate.invalidate({ tags: ["images"] });
	}

	async uploadToStorage(path: string, buffer: Buffer): Promise<void> {
		await minioClient.putObject(env.MINIO_BUCKET_NAME, path, buffer);
	}
}

export const imageCommandRepository = new ImageCommandRepository();
