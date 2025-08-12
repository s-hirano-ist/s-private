import { StatusCodeView } from "@/components/status/status-code-view";
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
					markdown: true,
				},
				orderBy: { title: "desc" },
			})
		).map((d) => {
			return {
				id: d.id,
				title: d.title,
				description: d.markdown,
				href: "https://example.com", // FIXME: TODO:
			};
		});

		return <ContentsStackClient data={unexportedContents} />;
	} catch (error) {
		loggerError("unexpected", { caller: "ContentsStack", status: 500 }, error);
		return (
			<div className="flex flex-col items-center">
				<StatusCodeView statusCode="500" />
			</div>
		);
	}
}
