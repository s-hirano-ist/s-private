import { CountBadge } from "@/components/count-badge";
import { Pagination } from "@/components/stack/pagination";

type Props = {
	page: number;
	totalImages: number;
};

export function ImageCounterClient({ page, totalImages }: Props) {
	return (
		<>
			<CountBadge label="totalImages" total={totalImages} />
			<Pagination currentPage={page} totalPages={totalImages} />
		</>
	);
}
