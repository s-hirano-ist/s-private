import { forbidden } from "next/navigation";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import { getAllStaticBooks } from "@/features/viewer/actions/static-books";
import { BooksStackClient } from "./client";

export async function BooksStack() {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) forbidden();

	const previewCardData = await getAllStaticBooks();

	return <BooksStackClient previewCardData={previewCardData} />;
}
