"use server";
import "server-only";
import { StatusCodeView } from "@/components/card/status-code-view";
import { CardStack } from "@/components/stack/card-stack";
import { ERROR_MESSAGES } from "@/constants";
import { getUserId } from "@/features/auth/utils/get-session";
import { loggerError } from "@/pino";
import prisma from "@/prisma";

export async function NewsStack() {
	try {
		const userId = await getUserId();

		const unexportedNews = (
			await prisma.news.findMany({
				where: { status: "UNEXPORTED", userId },
				select: {
					id: true,
					title: true,
					quote: true,
					url: true,
					Category: { select: { name: true } },
				},
				orderBy: { id: "desc" },
			})
		).map((d) => {
			return {
				id: d.id,
				title: d.title,
				quote: d.quote,
				url: d.url,
				category: d.Category.name,
			};
		});
		return <CardStack data={unexportedNews} />;
	} catch (error) {
		loggerError(
			ERROR_MESSAGES.UNEXPECTED,
			{
				caller: "NewsStack",
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
