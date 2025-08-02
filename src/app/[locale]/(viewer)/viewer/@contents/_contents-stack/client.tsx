import { PreviewCardData } from "@/components/card/preview-card";
import { PreviewStackClient } from "@/components/stack/preview-stack";

const basePath = "contents";

type Props = {
	previewCardData: PreviewCardData[];
};

export function ContentsStackClient({ previewCardData }: Props) {
	return (
		<PreviewStackClient
			basePath={basePath}
			imageType="svg"
			previewCardData={previewCardData}
		/>
	);
}
