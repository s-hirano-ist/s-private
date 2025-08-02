import { StatusCodeView } from "@/components/card/status-code-view";
import {
	getSelfId,
	hasDumperPostPermission,
} from "@/features/auth/utils/session";
import { addNews } from "@/features/news/actions/add-news";
import { loggerError } from "@/pino";
import prisma from "@/prisma";
import { AddNewsFormClient } from "./client";

export async function AddNewsForm() {
	try {
		const hasPostPermission = await hasDumperPostPermission();

		if (!hasPostPermission) return <></>;

		const categories = await (async () => {
			try {
				const userId = await getSelfId();
				return await prisma.categories.findMany({
					where: { userId },
					select: { id: true, name: true },
					orderBy: { name: "asc" },
				});
			} catch (error) {
				loggerError(
					"unexpected",
					{
						caller: "AddNewsFormCategory",
						status: 500,
					},
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
