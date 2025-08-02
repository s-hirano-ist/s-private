import { PreviewCardData } from "@/components/card/preview-card";
import { PreviewStackClient } from "@/components/stack/preview-stack";

type Props = { previewCardData: PreviewCardData[] };

const basePath = "books";

export function BooksStackClient({ previewCardData }: Props) {
	return (
		<PreviewStackClient
			basePath={basePath}
			imageType="webp"
			previewCardData={previewCardData}
		/>
	);
}
