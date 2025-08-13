import { ContentsPagination } from "@/components/contents-pagination";
import { CountBadge } from "@/components/count-badge";
import { Unexpected } from "@/components/status/unexpected";
import { PAGE_SIZE } from "@/constants";
import { getImagesCount } from "@/features/images/actions/get-images";
import { hasViewerAdminPermission } from "@/utils/auth/session";

type Props = { page: number };

export async function ImageCounter({ page }: Props) {
	try {
		const hasAdminPermission = await hasViewerAdminPermission();
		if (!hasAdminPermission) return <></>;

		const totalImages = await getImagesCount("EXPORTED");
		const totalPages = Math.ceil(totalImages / PAGE_SIZE);
		return (
			<>
				<CountBadge label="totalImages" total={totalImages} />
				<ContentsPagination currentPage={page} totalPages={totalPages} />
			</>
		);
	} catch (error) {
		return <Unexpected caller="ImageCounter" error={error} />;
	}
}
