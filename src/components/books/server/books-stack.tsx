import type { ServerAction } from "@/common/types";
import { ImageCardData } from "@/components/common/layouts/cards/image-card";
import { ImageCardStack } from "@/components/common/layouts/cards/image-card-stack";

type Props = {
	getBooks(): Promise<ImageCardData[]>;
	deleteBooks?: (id: string) => Promise<ServerAction>;
};

export async function BooksStack({ getBooks, deleteBooks }: Props) {
	const data = await getBooks();

	return (
		<ImageCardStack
			basePath="book"
			data={data}
			deleteAction={deleteBooks}
			showDeleteButton={deleteBooks !== undefined}
		/>
	);
}
