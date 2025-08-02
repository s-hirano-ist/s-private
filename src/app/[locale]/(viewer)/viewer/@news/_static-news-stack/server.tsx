import { StatusCodeView } from "@/components/card/status-code-view";
import { Unauthorized } from "@/components/card/unauthorized";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import { getStaticNews } from "@/features/viewer/actions/static-news";
import { loggerError } from "@/pino";
import { StaticNewsStackClient } from "./client";

type Props = { page: number };

export async function StaticNewsStack({ page }: Props) {
	try {
		const hasAdminPermission = await hasViewerAdminPermission();
		if (!hasAdminPermission) return <Unauthorized />;

		const news = await getStaticNews(page);
		return <StaticNewsStackClient data={news} />;
	} catch (error) {
		loggerError(
			"unexpected",
			{
				caller: "StaticNewsStack",
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
