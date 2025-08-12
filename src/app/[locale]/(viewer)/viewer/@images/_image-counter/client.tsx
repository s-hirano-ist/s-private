import { ContentsPagination } from "@/components/contents-pagination";
import { CountBadge } from "@/components/count-badge";

type Props = {
	page: number;
	totalImages: number;
};

export function ImageCounterClient({ page, totalImages }: Props) {
	return (
		<>
			<CountBadge label="totalImages" total={totalImages} />
			<ContentsPagination currentPage={page} totalPages={totalImages} />
		</>
	);
}
