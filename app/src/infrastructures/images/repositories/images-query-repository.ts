import {
	type ExportedImage,
	type ImageListItemDTO,
	makeContentType,
	makeFileSize,
	makePath,
	makePixel,
	type UnexportedImage,
} from "@s-hirano-ist/s-core/images/entities/image-entity";
import type { IImagesQueryRepository } from "@s-hirano-ist/s-core/images/repositories/images-query-repository.interface";
import type { ImagesFindManyParams } from "@s-hirano-ist/s-core/images/types/query-params";
import {
	makeCreatedAt,
	makeExportedAt,
	makeId,
	makeUserId,
	type Status,
} from "@s-hirano-ist/s-core/shared-kernel/entities/common-entity";
import prisma from "@/prisma";

async function findByPath(
	path: string,
	userId: string,
): Promise<UnexportedImage | ExportedImage | null> {
	const data = await prisma.image.findUnique({
		where: { path_userId: { path, userId } },
		select: {
			id: true,
			userId: true,
			path: true,
			contentType: true,
			fileSize: true,
			width: true,
			height: true,
			status: true,
			createdAt: true,
			exportedAt: true,
		},
	});
	if (!data) return null;

	const base = {
		id: makeId(data.id),
		userId: makeUserId(data.userId),
		path: makePath(data.path, false),
		contentType: makeContentType(data.contentType),
		fileSize: makeFileSize(data.fileSize ?? 0),
		width: data.width !== null ? makePixel(data.width) : undefined,
		height: data.height !== null ? makePixel(data.height) : undefined,
		createdAt: makeCreatedAt(data.createdAt),
	};

	if (data.status === "EXPORTED" && data.exportedAt) {
		return Object.freeze({
			...base,
			status: "EXPORTED" as const,
			exportedAt: makeExportedAt(data.exportedAt),
		});
	}
	return Object.freeze({ ...base, status: "UNEXPORTED" as const });
}

async function findMany(
	userId: string,
	status: Status,
	params?: ImagesFindManyParams,
): Promise<ImageListItemDTO[]> {
	const data = await prisma.image.findMany({
		where: { userId, status },
		select: {
			id: true,
			path: true,
			width: true,
			height: true,
		},
		...params,
	});
	return data.map((d) => ({
		id: makeId(d.id),
		path: makePath(d.path, false),
		width: d.width !== null ? makePixel(d.width) : undefined,
		height: d.height !== null ? makePixel(d.height) : undefined,
	}));
}

async function count(userId: string, status: Status): Promise<number> {
	const data = await prisma.image.count({ where: { userId, status } });
	return data;
}

export const imagesQueryRepository: IImagesQueryRepository = {
	findByPath,
	findMany,
	count,
};
