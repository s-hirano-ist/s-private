import { StatusCodeView } from "@/components/card/status-code-view";
import { loggerError } from "@/pino";
import prisma from "@/prisma";
import { getSelfId } from "@/utils/auth/session";
import { ContentsStackClient } from "./client";

export async function ContentsStack() {
	try {
		const userId = await getSelfId();
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

		return <ContentsStackClient cardStackData={unexportedContents} />;
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
