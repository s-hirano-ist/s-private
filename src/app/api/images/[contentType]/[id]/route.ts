import { forbidden } from "next/navigation";
import { NextResponse } from "next/server";
import { getImagesFromStorage } from "@/applications/images/get-images";
import { auth } from "@/common/auth/auth";

export const GET = auth(
	async (
		request,
		{ params }: { params: Promise<{ contentType: string; id: string }> },
	) => {
		const { contentType, id } = await params;

		if (!request.auth)
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		if (!request.auth.user.roles.includes("viewer")) forbidden();

		const isThumbnail = contentType === "thumbnail";
		const stream = await getImagesFromStorage(id, isThumbnail);

		// eslint-disable-next-line
		return new Response(stream as any, {
			headers: {
				"Content-Type": "image/jpeg",
				"Cache-Control": "public, max-age=31536000, immutable",
			},
		});
	},
);
