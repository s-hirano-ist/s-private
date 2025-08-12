import { ImageData, ImageStack } from "@/components/image/image-stack";

type Props = { images: ImageData[] };

export function ImageStackClient({ images }: Props) {
	return <ImageStack data={images} />;
}
