import { ImageStack, ImageStackData } from "@/components/stack/image-stack";

type Props = { images: ImageStackData };

export function AllImageStackClient({ images }: Props) {
	return <ImageStack data={images} />;
}
