import {
	getSelfId,
	hasDumperPostPermission,
} from "@/features/auth/utils/session";
import { loggerError } from "@/pino";
import prisma from "@/prisma";
import { AddNewsFormClient } from "./client";

export async function AddNewsForm() {
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
					caller: "CategoryFetch",
					status: 500,
				},
				error,
			);
			return [];
		}
	})();

	return <AddNewsFormClient categories={categories} />;
}
