import { Readable } from "node:stream";
import { forbidden } from "next/navigation";
import { NextResponse } from "next/server";
import { getImagesFromStorage } from "@/application-services/images/get-images";
import { auth } from "@/infrastructures/auth/auth-provider";

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
		const nodeStream = await getImagesFromStorage(id, isThumbnail);
		const webStream = Readable.toWeb(
			nodeStream as Readable,
		) as unknown as ReadableStream;

		return new Response(webStream, {
			headers: {
				"Content-Type": "image/jpeg",
				"Cache-Control": "public, max-age=31536000, immutable",
			},
		});
	},
);
