import { forbidden } from "next/navigation";
import { ImageCardData } from "@/components/card/image-card";
import { ImageCardStack } from "@/components/card/image-card-stack";
import { Unexpected } from "@/components/status/unexpected";
import { hasViewerAdminPermission } from "@/utils/auth/session";

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
