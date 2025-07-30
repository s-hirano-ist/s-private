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
import db from "@/db";
import { categories } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function SuspensePage() {
	const hasPostPermission = await hasDumperPostPermission();

	const categoryList = await (async () => {
		try {
			const userId = await getSelfId();
			return await db
				.select({
					id: categories.id,
					name: categories.name,
				})
				.from(categories)
				.where(eq(categories.userId, userId))
				.orderBy(asc(categories.name));
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
			{hasPostPermission && <AddNewsForm categories={categoryList} />}
			<Separator className="h-px bg-linear-to-r from-primary to-primary-grad" />
			<Suspense fallback={<CardStackSkeleton />}>
				<NewsStack />
			</Suspense>
		</>
	);
}
