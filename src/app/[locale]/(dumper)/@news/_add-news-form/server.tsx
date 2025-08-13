import { Unexpected } from "@/components/status/unexpected";
import { addNews } from "@/features/news/actions/add-news";
import { getCategoriesByUserId } from "@/features/news/actions/get-news";
import { serverLogger } from "@/infrastructure/server";
import { hasDumperPostPermission } from "@/utils/auth/session";
import { AddNewsFormClient } from "./client";

export async function AddNewsForm() {
	try {
		const hasPostPermission = await hasDumperPostPermission();

		if (!hasPostPermission) return <></>;

		const categories = await (async () => {
			try {
				return await getCategoriesByUserId();
			} catch (error) {
				serverLogger.error(
					"unexpected",
					{ caller: "AddNewsFormCategory", status: 500 },
					error,
				);
				return [];
			}
		})();

		return <AddNewsFormClient addNews={addNews} categories={categories} />;
	} catch (error) {
		return <Unexpected caller="AddNewsForm" error={error} />;
	}
}
