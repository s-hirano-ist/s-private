import { ContentsPagination } from "@/components/contents-pagination";
import { CountBadge } from "@/components/count-badge";

type Props = {
	page: number;
	totalNews: number;
};

export function NewsCounterClient({ page, totalNews }: Props) {
	return (
		<>
			<CountBadge label="totalNews" total={totalNews} />
			<ContentsPagination currentPage={page} totalPages={totalNews} />
		</>
	);
}
