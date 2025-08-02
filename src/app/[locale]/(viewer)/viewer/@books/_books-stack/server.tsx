import { forbidden } from "next/navigation";
import { StatusCodeView } from "@/components/card/status-code-view";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import { getAllStaticBooks } from "@/features/viewer/actions/static-books";
import { BooksStackClient } from "./client";

export async function BooksStack() {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) forbidden();

	try {
		const previewCardData = await getAllStaticBooks();

		return <BooksStackClient previewCardData={previewCardData} />;
	} catch (error) {
		return <StatusCodeView statusCode="500" />;
	}
}
