"use server";
import "server-only";
import { StatusCodeView } from "@/components/card/status-code-view";
import { CardStack } from "@/components/stack/card-stack";
import { ERROR_MESSAGES } from "@/constants";
import { getUserId } from "@/features/auth/utils/get-session";
import { loggerError } from "@/pino";
import prisma from "@/prisma";

export async function ContentsStack() {
	try {
		const userId = await getUserId();
		const unexportedContents = (
			await prisma.contents.findMany({
				where: { status: "UNEXPORTED", userId },
				select: {
					id: true,
					title: true,
					quote: true,
					url: true,
				},
				orderBy: { id: "desc" },
			})
		).map((d) => {
			return {
				id: d.id,
				title: d.title,
				quote: d.quote,
				url: d.url,
			};
		});

		return <CardStack data={unexportedContents} />;
	} catch (error) {
		loggerError(
			ERROR_MESSAGES.UNEXPECTED,
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
