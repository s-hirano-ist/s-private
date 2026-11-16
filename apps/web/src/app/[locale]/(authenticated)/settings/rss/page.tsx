import { RssLoading } from "@/components/rss/rss-loading";
import { RssReaderLoader } from "@/loaders/rss/rss-reader-loader";
import { Suspense } from "react";
export default function Page() {
	return (
		<Suspense fallback={<RssLoading />}>
			<RssReaderLoader view="feeds" />
		</Suspense>
	);
}
