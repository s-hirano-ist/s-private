import { forbidden } from "next/navigation";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { ImageCardData } from "@/common/components/card/image-card";
import { ImageCardStack } from "@/common/components/card/image-card-stack";
import { Unexpected } from "@/common/components/status/unexpected";
import type { ServerAction } from "@/common/types";

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
