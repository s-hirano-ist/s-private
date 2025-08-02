import { PreviewCardData } from "@/components/card/preview-card";
import { CountBadge } from "@/components/count-badge";
import { PreviewStackClient } from "@/components/stack/preview-stack";

type Props = {
	totalBooks: number;
	previewCardData: PreviewCardData[];
};

const basePath = "books";

export function BooksStackClient({ totalBooks, previewCardData }: Props) {
	return (
		<>
			<CountBadge label="totalBooks" total={totalBooks} />
			<PreviewStackClient
				basePath={basePath}
				imageType="webp"
				previewCardData={previewCardData}
			/>
		</>
	);
}
