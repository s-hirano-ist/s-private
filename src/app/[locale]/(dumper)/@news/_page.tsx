import { Suspense } from "react";
import { CardStackSkeleton } from "@/components/stack/card-stack-skeleton";
import { Separator } from "@/components/ui/separator";
import {
	getSelfId,
	hasDumperPostPermission,
} from "@/features/auth/utils/session";
import { AddNewsForm } from "@/features/news/components/add-news-form";
import { NewsStack } from "@/features/news/components/news-stack";
import { loggerError } from "@/pino";
import prisma from "@/prisma";

export async function SuspensePage() {
	const hasPostPermission = await hasDumperPostPermission();

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

	return (
		<>
			{hasPostPermission && <AddNewsForm categories={categories} />}
			<Separator className="h-px bg-linear-to-r from-primary to-primary-grad" />
			<Suspense fallback={<CardStackSkeleton />}>
				<NewsStack />
			</Suspense>
		</>
	);
}
