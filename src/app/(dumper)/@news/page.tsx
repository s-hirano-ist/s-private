import { CardStackSkeleton } from "@/components/stack/card-stack-skeleton";
import { Separator } from "@/components/ui/separator";
import { ERROR_MESSAGES } from "@/constants";
import { getSelfId, hasDumperPostPermission } from "@/features/auth/utils/role";
import { AddNewsForm } from "@/features/news/components/add-news-form";
import { NewsStack } from "@/features/news/components/news-stack";
import { loggerError } from "@/pino";
import prisma from "@/prisma";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function Page() {
	const hasPostPermission = await hasDumperPostPermission();

	const categories = await (async () => {
		try {
			const userId = await getSelfId();
			return await prisma.categories.findMany({
				where: { userId },
				select: { id: true, name: true },
			});
		} catch (error) {
			loggerError(
				ERROR_MESSAGES.UNEXPECTED,
				{
					caller: "CategoryFetch",
					status: 500,
				},
				error,
			);
			return [];
		}
	})();

	return (
		<>
			{hasPostPermission && <AddNewsForm categories={categories} />}
			<Separator className="h-px bg-gradient-to-r from-primary to-primary-grad" />
			<Suspense fallback={<CardStackSkeleton />}>
				<NewsStack />
			</Suspense>
		</>
	);
}
