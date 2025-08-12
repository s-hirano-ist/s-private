import { env } from "@/env";
import type { Images, Status } from "@/generated";
import { minioClient } from "@/minio";
import prisma from "@/prisma";

export type IImageCommandRepository = {
	create(data: ImageCreateInput): Promise<Images>;
	updateStatus(id: string, status: Status): Promise<Images>;
	updateManyStatus(
		userId: string,
		fromStatus: Status,
		toStatus: Status,
	): Promise<number>;
	delete(id: string): Promise<void>;
	invalidateCache(): Promise<void>;
	uploadToStorage(path: string, buffer: Buffer): Promise<void>;
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

export class ImageCommandRepository implements IImageCommandRepository {
	async create(data: ImageCreateInput): Promise<Images> {
		return await prisma.images.create({
			data,
		});
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

	async invalidateCache(): Promise<void> {
		await prisma.$accelerate.invalidate({ tags: ["images"] });
	}

	async uploadToStorage(path: string, buffer: Buffer): Promise<void> {
		await minioClient.putObject(env.MINIO_BUCKET_NAME, path, buffer);
	}

	async transaction<T>(fn: () => Promise<T>): Promise<T> {
		return await prisma.$transaction(fn);
	}
}

export const imageCommandRepository = new ImageCommandRepository();
