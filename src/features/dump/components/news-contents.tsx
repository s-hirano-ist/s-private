import { getUnexportedNews } from "@/apis/prisma/fetch-news";
import { StatusCodeView } from "@/components/status-code-view";
import { auth } from "@/features/auth/lib/auth";
import { NewsStack } from "./news-stack";

export async function NewsContents() {
	try {
		const session = await auth();
		const userId = session?.user?.id;
		if (!session || !userId) throw new Error("Unauthorized");

		const unexportedNews = await getUnexportedNews(userId);
		return (
			<NewsStack
				news={unexportedNews.map((d) => {
					return {
						id: d.id,
						title: d.title,
						quote: d.quote,
						url: d.url,
						category: d.categories?.name ?? "",
					};
				})}
			/>
		);
	} catch (error) {
		console.error("Unexpected error.", error);
		return (
			<div className="flex flex-col items-center">
				<StatusCodeView statusCode="500" />
			</div>
		);
	}
}
