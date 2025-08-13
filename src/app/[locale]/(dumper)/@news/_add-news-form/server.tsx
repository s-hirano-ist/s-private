import { StatusCodeView } from "@/components/status/status-code-view";
import { addNews } from "@/features/news/actions/add-news";
import { getCategoriesByUserId } from "@/features/news/actions/get-news";
import { loggerError } from "@/pino";
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
				loggerError(
					"unexpected",
					{ caller: "AddNewsFormCategory", status: 500 },
					error,
				);
				return [];
			}
		})();

		return <AddNewsFormClient addNews={addNews} categories={categories} />;
	} catch (error) {
		loggerError("unexpected", { caller: "AddNewsForm", status: 500 }, error);
		return (
			<div className="flex flex-col items-center">
				<StatusCodeView statusCode="500" />
			</div>
		);
	}
}
