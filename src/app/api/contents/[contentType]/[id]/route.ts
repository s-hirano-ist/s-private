import { forbidden } from "next/navigation";
import { NextResponse } from "next/server";
import { ORIGINAL_IMAGE_PATH, THUMBNAIL_IMAGE_PATH } from "@/constants";
import { imageRepository } from "@/features/image/repositories/image-repository";
import { auth } from "@/utils/auth/auth";

export const GET = auth(
	async (
		request,
		{ params }: { params: Promise<{ contentType: string; id: string }> },
	) => {
		const { contentType, id } = await params;

		if (!request.auth)
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		if (!request.auth.user.roles.includes("viewer")) forbidden();

		const objKey = `${contentType === "thumbnail" ? THUMBNAIL_IMAGE_PATH : ORIGINAL_IMAGE_PATH}/${id}`;

		const stream = await imageRepository.getFromStorage(objKey);

		// eslint-disable-next-line
		return new Response(stream as any, {
			headers: {
				"Content-Type": "image/jpeg",
				"Cache-Control": "public, max-age=31536000, immutable",
			},
		});
	},
);
