import { ImageCardData } from "@/components/card/image-card";
import { ImageCardStack } from "@/components/card/image-card-stack";

type Props = { data: ImageCardData[] };

const basePath = "book";

export function BooksStackClient({ data }: Props) {
	return <ImageCardStack basePath={basePath} data={data} />;
}
