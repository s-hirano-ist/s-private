import * as services from "@/application-services/rss/actions";
import { RssReader } from "@/components/rss/rss-reader";
import { connection } from "next/server";
import { Suspense } from "react";
async function Reader() {
	await connection();
	const initialData = await services.loadRss();
	return (
		<RssReader
			initialData={initialData}
			services={{
				loadRss: services.loadRss,
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
export default function Page() {
	return (
		<Suspense>
			<Reader />
		</Suspense>
	);
}
