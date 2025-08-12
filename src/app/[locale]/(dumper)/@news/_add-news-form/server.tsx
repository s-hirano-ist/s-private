import { StatusCodeView } from "@/components/status/status-code-view";
import { addNews } from "@/features/news/actions/add-news";
import { categoryQueryRepository } from "@/features/news/repositories/category-query-repository";
import { loggerError } from "@/pino";
import { getSelfId, hasDumperPostPermission } from "@/utils/auth/session";
import { AddNewsFormClient } from "./client";

export async function AddNewsForm() {
	try {
		const hasPostPermission = await hasDumperPostPermission();

		if (!hasPostPermission) return <></>;

		const categories = await (async () => {
			try {
				const userId = await getSelfId();
				return await categoryQueryRepository.findByUserId(userId);
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
