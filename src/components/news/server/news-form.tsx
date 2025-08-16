import type { getCategories } from "@/application-services/news/get-news";
import { ServerAction } from "@/common/types";
import { NewsFormClient } from "../client/news-form-client";

type Props = {
	addNews: (formData: FormData) => Promise<ServerAction>;
	getCategories: typeof getCategories;
};

export async function NewsForm({ addNews, getCategories }: Props) {
	const categories = await getCategories();

	return <NewsFormClient addNews={addNews} categories={categories} />;
}
