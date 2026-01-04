import { forbidden } from "next/navigation";
import { NextResponse } from "next/server";
import { getBooksImageFromStorage } from "@/application-services/books/get-books";
import { auth } from "@/infrastructures/auth/auth-provider";

export const GET = auth(
	async (
		request,
		{ params }: { params: Promise<{ contentType: string; path: string }> },
	) => {
		const { contentType, path } = await params;

		if (!request.auth)
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		if (!request.auth.user.roles.includes("viewer")) forbidden();

		const isThumbnail = contentType === "thumbnail";
		const stream = await getBooksImageFromStorage(path, isThumbnail);

		return new Response(stream as unknown as BodyInit, {
			headers: {
				"Content-Type": "image/jpeg",
				"Cache-Control": "public, max-age=31536000, immutable",
			},
		});
	},
);
