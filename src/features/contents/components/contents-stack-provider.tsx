"use server";
import "server-only";
import { StatusCodeView } from "@/components/card/status-code-view";
import { ERROR_MESSAGES } from "@/constants";
import { getUserId } from "@/features/auth/utils/get-session";
import { loggerError } from "@/pino";
import prisma from "@/prisma";
import { ContentsStack } from "./contents-stack";

export async function ContentsStackProvider() {
	try {
		const userId = await getUserId();
		const unexportedContents = await prisma.contents.findMany({
			where: { status: "UNEXPORTED", userId },
			select: {
				id: true,
				title: true,
				quote: true,
				url: true,
			},
			orderBy: { id: "desc" },
		});

		return (
			<ContentsStack
				contents={unexportedContents.map((d) => {
					return {
						id: d.id,
						title: d.title,
						quote: d.quote,
						url: d.url,
					};
				})}
			/>
		);
	} catch (error) {
		loggerError(
			ERROR_MESSAGES.UNEXPECTED,
			{
				caller: "ContentsStackProvider",
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
