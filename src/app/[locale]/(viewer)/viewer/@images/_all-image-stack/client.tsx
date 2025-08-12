import { ImageData, ImageStack } from "@/components/image/image-stack";

type Props = { data: ImageData[] };

export function AllImageStackClient({ data }: Props) {
	return <ImageStack data={data} />;
}
