import { forbidden } from "next/navigation";
import { hasViewerAdminPermission } from "@/common/auth/session";
import type { ServerAction } from "@/common/types";
import { ImageCardData } from "@/components/common/card/image-card";
import { ImageCardStack } from "@/components/common/card/image-card-stack";
import { Unexpected } from "@/components/common/status/unexpected";

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
