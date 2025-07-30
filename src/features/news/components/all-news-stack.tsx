import { StatusCodeView } from "@/components/card/status-code-view";
import { getStaticNews } from "@/features/viewer/actions/static-news";
import { loggerError } from "@/pino";
import { StaticNewsStack } from "./static-news-stack";

type Props = { page: number };

export async function AllNewsStack({ page }: Props) {
	try {
		const news = await getStaticNews(page);
		return <StaticNewsStack data={news} />;
	} catch (error) {
		loggerError(
			"unexpected",
			{
				caller: "AllNewsPage",
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
