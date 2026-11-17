import * as services from "@/application-services/rss/actions";
import { RssReader } from "@/components/rss/rss-reader";
import { connection } from "next/server";
export async function RssReaderLoader({
	view = "unread",
}: {
	view?: "unread" | "saved" | "feeds";
}) {
	await connection();
	const initialData = await services.loadRss(0, undefined, view);
	return (
		<RssReader
			initialData={initialData}
			view={view}
			key={view}
			services={{
				subscribeRss: services.subscribeRss,
				unsubscribeRss: services.unsubscribeRss,
				markRssRead: services.markRssRead,
				saveRss: services.saveRss,
				unsaveRss: services.unsaveRss,
				importRss: services.importRss,
			}}
		/>
	);
}
