"use server";
import "server-only";
import { StatusCodeView } from "@/components/card/status-code-view";
import { CardStack } from "@/components/stack/card-stack";
import { getSelfId } from "@/features/auth/utils/session";
import { loggerError } from "@/pino";
import db from "@/db";
import { contents } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function ContentsStack() {
	try {
		const userId = await getSelfId();
		const unexportedContents = (
			await db
				.select({
					id: contents.id,
					title: contents.title,
					quote: contents.quote,
					url: contents.url,
				})
				.from(contents)
				.where(and(eq(contents.status, "UNEXPORTED"), eq(contents.userId, userId)))
				.orderBy(desc(contents.id))
		).map((d) => {
			return {
				id: d.id,
				title: d.title,
				quote: d.quote,
				url: d.url,
			};
		});

		return <CardStack data={unexportedContents} showDeleteButton={false} />;
	} catch (error) {
		loggerError(
			"unexpected",
			{
				caller: "ContentsStack",
				status: 500,
			},
			error,
		);
		return (
			<div className="flex flex-col items-center">
				<StatusCodeView statusCode="500" />
			</div>
		);
	}
}
