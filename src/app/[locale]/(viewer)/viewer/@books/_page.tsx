import { Unauthorized } from "@/components/card/unauthorized";
import { CountBadge } from "@/components/count-badge";
import { ViewerStack } from "@/components/stack/viewer-stack";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import {
	getAllStaticBooks,
	getStaticBooksCount,
} from "@/features/viewer/actions/static-books";

const path = "books";

export async function SuspensePage() {
	const hasAdminPermission = await hasViewerAdminPermission();

	const totalImages = await getStaticBooksCount();
	const images = await getAllStaticBooks();

	return (
		<>
			{hasAdminPermission ? (
				<>
					<CountBadge label="totalBooks" total={totalImages} />
					<ViewerStack imageType="webp" images={images} path={path} />
				</>
			) : (
				<Unauthorized />
			)}
		</>
	);
}
