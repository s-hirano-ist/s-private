import { headers } from "next/headers";
import { forbidden } from "next/navigation";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getImagesFromStorage } from "@/application-services/images/get-images";
import { auth, type Role } from "@/infrastructures/auth/auth";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ contentType: string; id: string }> },
) {
	const { contentType, id } = await params;

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	// NOTE: Better Authのセッションにはカスタムフィールドが含まれないため、
	// ロールチェックは別途実装が必要
	const roles = (session.user as unknown as { roles?: Role[] }).roles ?? [];
	if (!roles.includes("viewer")) forbidden();

	const isThumbnail = contentType === "thumbnail";
	const stream = await getImagesFromStorage(id, isThumbnail);

	return new Response(stream as unknown as BodyInit, {
		headers: {
			"Content-Type": "image/jpeg",
			"Cache-Control": "public, max-age=31536000, immutable",
		},
	});
}
