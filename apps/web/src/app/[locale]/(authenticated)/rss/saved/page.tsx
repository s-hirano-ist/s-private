import { RssReaderLoader } from "@/loaders/rss/rss-reader-loader";
import { Suspense } from "react";
export default function Page() {
	return (
		<Suspense>
			<RssReaderLoader view="saved" />
		</Suspense>
	);
}
