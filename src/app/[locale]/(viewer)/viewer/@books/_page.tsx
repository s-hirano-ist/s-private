import { Unauthorized } from "@/components/card/unauthorized";
import { CountBadge } from "@/components/count-badge";
import { PreviewStackClient } from "@/components/stack/preview-stack";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import {
	getAllStaticBooks,
	getStaticBooksCount,
} from "@/features/viewer/actions/static-books";

const basePath = "books";

export async function SuspensePage() {
	const hasAdminPermission = await hasViewerAdminPermission();

	const totalImages = await getStaticBooksCount();
	const previewCardData = await getAllStaticBooks();

	return (
		<>
			{hasAdminPermission ? (
				<>
					<CountBadge label="totalBooks" total={totalImages} />
					<PreviewStackClient
						basePath={basePath}
						imageType="webp"
						previewCardData={previewCardData}
					/>
				</>
			) : (
				<Unauthorized />
			)}
		</>
	);
}
