import { env } from "@/env";
import type { Images } from "@/generated";
import { minioClient } from "@/minio";
import prisma from "@/prisma";

type IImageCommandRepository = {
	create(data: ImageCreateInput): Promise<Images>;
	uploadToStorage(path: string, buffer: Buffer): Promise<void>;
};

type ImageCreateInput = {
	paths: string;
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

	async uploadToStorage(path: string, buffer: Buffer): Promise<void> {
		await minioClient.putObject(env.MINIO_BUCKET_NAME, path, buffer);
	}
}

export const imageCommandRepository = new ImageCommandRepository();
