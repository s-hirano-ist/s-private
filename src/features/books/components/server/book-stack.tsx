import { forbidden } from "next/navigation";
import { hasViewerAdminPermission } from "@/common/auth/session";
import { ImageCardData } from "@/common/components/card/image-card";
import { ImageCardStack } from "@/common/components/card/image-card-stack";
import { Unexpected } from "@/common/components/status/unexpected";

type Props = { getBooks(): Promise<ImageCardData[]> };

export async function BooksStack({ getBooks }: Props) {
	const hasPermission = await hasViewerAdminPermission();
	if (!hasPermission) forbidden();

	try {
		const data = await getBooks();

		return <ImageCardStack basePath="book" data={data} />;
	} catch (error) {
		return <Unexpected caller="BooksStack" error={error} />;
	}
}
