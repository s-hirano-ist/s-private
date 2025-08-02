import { StatusCodeView } from "@/components/card/status-code-view";
import { Unauthorized } from "@/components/card/unauthorized";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import { getStaticNewsCount } from "@/features/viewer/actions/static-news";
import { loggerError } from "@/pino";
import { NewsCounterClient } from "./client";

type Props = { page: number };

export async function NewsCounter({ page }: Props) {
	try {
		const hasAdminPermission = await hasViewerAdminPermission();
		if (!hasAdminPermission) return <Unauthorized />;

		const totalNews = await getStaticNewsCount();

		return <NewsCounterClient page={page} totalNews={totalNews} />;
	} catch (error) {
		loggerError(
			"unexpected",
			{
				caller: "NewsCounter",
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
