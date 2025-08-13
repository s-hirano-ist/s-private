import { LinkCardStack } from "@/components/card/link-card-stack";
import { Unexpected } from "@/components/status/unexpected";
import { deleteNews } from "@/features/news/actions/delete-news";
import { getUnexportedNews } from "@/features/news/actions/get-news";

export async function NewsStack() {
	try {
		const unexportedNews = await getUnexportedNews();

		return (
			<LinkCardStack
				data={unexportedNews}
				deleteAction={deleteNews}
				showDeleteButton
			/>
		);
	} catch (error) {
		return <Unexpected caller="NewsStack" error={error} />;
	}
}
