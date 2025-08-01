import { Unauthorized } from "@/components/card/unauthorized";
import { CountBadge } from "@/components/count-badge";
import { PreviewStackClient } from "@/components/stack/preview-stack";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import {
	getAllStaticBooks,
	getStaticBooksCount,
} from "@/features/viewer/actions/static-books";

const basePath = "books";

export async function PreviewStack() {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) return <Unauthorized />;

	const totalImages = await getStaticBooksCount();
	const previewCardData = await getAllStaticBooks();

	return (
		<>
			<CountBadge label="totalBooks" total={totalImages} />
			<PreviewStackClient
				basePath={basePath}
				imageType="webp"
				previewCardData={previewCardData}
			/>
		</>
	);
}
