import { forbidden } from "next/navigation";
import { Unexpected } from "@/components/status/unexpected";
import { getCategories } from "@/features/news/actions/get-news";
import { serverLogger } from "@/o11y/server";
import { hasDumperPostPermission } from "@/utils/auth/session";
import { ServerAction } from "@/utils/types";
import { NewsFormClient } from "../client/news-form-client";

type Props = {
	addNews: (formData: FormData) => Promise<ServerAction>;
};

export async function NewsForm({ addNews }: Props) {
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
