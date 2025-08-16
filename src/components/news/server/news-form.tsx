import { forbidden } from "next/navigation";
import type { getCategories } from "@/application-services/news/get-news";
import { hasDumperPostPermission } from "@/common/auth/session";
import { ServerAction } from "@/common/types";
import { Unexpected } from "@/components/common/display/status/unexpected";
import { serverLogger } from "@/o11y/server";
import { NewsFormClient } from "../client/news-form-client";

type Props = {
	addNews: (formData: FormData) => Promise<ServerAction>;
	getCategories: typeof getCategories;
};

export async function NewsForm({ addNews, getCategories }: Props) {
	const hasPermission = await hasDumperPostPermission();
	if (!hasPermission) return forbidden();

	try {
		const categories = await (async () => {
			try {
				return await getCategories();
			} catch (error) {
				serverLogger.error(
					"unexpected",
					{ caller: "AddNewsFormCategory", status: 500 },
					error,
				);
				return [];
			}
		})();

		return <NewsFormClient addNews={addNews} categories={categories} />;
	} catch (error) {
		return <Unexpected caller="AddNewsForm" error={error} />;
	}
}
