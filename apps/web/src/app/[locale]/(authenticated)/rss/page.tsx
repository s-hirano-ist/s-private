import * as services from "@/application-services/rss/actions";
import { RssReader } from "@/components/rss/rss-reader";
import { connection } from "next/server";
import { Suspense } from "react";
async function Reader() {
	await connection();
	const initialData = await services.loadRss();
	return <RssReader initialData={initialData} services={services} />;
}
export default function Page() {
	return (
		<Suspense>
			<Reader />
		</Suspense>
	);
}
