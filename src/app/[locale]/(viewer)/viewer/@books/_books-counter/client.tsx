import { CountBadge } from "@/components/count-badge";

type Props = {
	totalBooks: number;
};

export function BooksCounterClient({ totalBooks }: Props) {
	return <CountBadge label="totalBooks" total={totalBooks} />;
}
