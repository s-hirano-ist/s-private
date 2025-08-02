import { CountBadge } from "@/components/count-badge";
import { Pagination } from "@/components/stack/pagination";

type Props = {
	page: number;
	totalNews: number;
};

export function NewsCounterClient({ page, totalNews }: Props) {
	return (
		<>
			<CountBadge label="totalNews" total={totalNews} />
			<Pagination currentPage={page} totalPages={totalNews} />
		</>
	);
}
