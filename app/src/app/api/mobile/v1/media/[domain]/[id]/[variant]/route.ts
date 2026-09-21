import {
	MobileApiError,
	withMobileTenant,
} from "@/application-services/mobile/auth";
import { mobileErrorResponse } from "@/application-services/mobile/http";
import { getContentTypeFromPath } from "@/common/utils/content-type-utils";
import { booksStorageService } from "@/infrastructures/shared/storage/books-storage-service";
import { minioStorageService } from "@/infrastructures/shared/storage/minio-storage-service";
import prisma from "@/prisma";
import { Readable } from "node:stream";

type Context = {
	params: Promise<{ domain: string; id: string; variant: string }>;
};

export async function GET(
	request: Request,
	{ params }: Context,
): Promise<Response> {
	try {
		const { domain, id, variant } = await params;
		if (
			!(
				["images", "books"].includes(domain) &&
				["original", "thumbnail"].includes(variant)
			)
		) {
			throw new MobileApiError("NOT_FOUND", 404);
		}
		return await withMobileTenant(request, async (userId) => {
			const image =
				domain === "images"
					? await prisma.image.findFirst({
							where: { id, userId },
							select: { path: true, contentType: true },
						})
					: await prisma.book.findFirst({
							where: { id, userId },
							select: { imagePath: true },
						});
			const path = image && ("path" in image ? image.path : image.imagePath);
			if (!path) throw new MobileApiError("NOT_FOUND", 404);
			const storage =
				domain === "images" ? minioStorageService : booksStorageService;
			const stream = await storage.getImage(path, variant === "thumbnail");
			let responseContentType = getContentTypeFromPath(path);
			if (variant === "thumbnail") responseContentType = "image/webp";
			else if ("contentType" in image) responseContentType = image.contentType;
			return new Response(
				Readable.toWeb(stream as Readable) as unknown as ReadableStream,
				{
					headers: {
						"Content-Type": responseContentType,
						"Cache-Control": "private, no-store",
					},
				},
			);
		});
	} catch (error) {
		return mobileErrorResponse(error);
	}
}
