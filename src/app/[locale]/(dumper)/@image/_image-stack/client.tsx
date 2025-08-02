import { ImageStack, ImageStackData } from "@/components/stack/image-stack";

type Props = { images: ImageStackData };

export function ImageStackClient({ images }: Props) {
	return <ImageStack data={images} />;
}
