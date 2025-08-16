import { forbidden } from "next/navigation";
import { hasViewerAdminPermission } from "@/common/auth/session";
import type { ServerAction } from "@/common/types";
import { Unexpected } from "@/components/common/display/status/unexpected";
import { ImageCardData } from "@/components/common/layouts/cards/image-card";
import { ImageCardStack } from "@/components/common/layouts/cards/image-card-stack";

type Props = {
	getBooks(): Promise<ImageCardData[]>;
	deleteBooks?: (id: string) => Promise<ServerAction>;
};

export async function BooksStack({ getBooks, deleteBooks }: Props) {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	try {
		const data = await getBooks();

		return (
			<ImageCardStack
				basePath="book"
				data={data}
				deleteAction={deleteBooks}
				showDeleteButton={deleteBooks !== undefined}
			/>
		);
	} catch (error) {
		return <Unexpected caller="BooksStack" error={error} />;
	}
}
