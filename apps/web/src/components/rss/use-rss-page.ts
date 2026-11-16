import type { loadRss } from "@/application-services/rss/client";
import type { RssPage } from "@s-hirano-ist/s-api-client/models";
import { useEffect, useRef, useState } from "react";

export function useRssPage(
	initialData: RssPage,
	readPage: typeof loadRss,
	offset: number,
	feedId: string,
	revision: number,
	setError: (error: boolean) => void,
) {
	const [data, setData] = useState(initialData);
	const [loading, setLoading] = useState(false);
	const displayed = useRef({ offset: 0, feedId: "" });
	useEffect(() => {
		let cancelled = false;
		// Only changing the page/filter disables page controls; background reads keep them usable.
		setLoading(
			displayed.current.offset !== offset ||
				displayed.current.feedId !== feedId,
		);
		async function reload() {
			try {
				const page = await readPage(offset, feedId || undefined);
				if (cancelled) return;
				displayed.current = { offset, feedId };
				setData(page);
				setLoading(false);
			} catch {
				if (cancelled) return;
				setError(true);
				setLoading(false);
			}
		}
		void reload();
		return () => {
			cancelled = true;
		};
		// revision deliberately invalidates the page after a feed or mutation completes.
		// oxlint-disable-next-line react/exhaustive-effect-dependencies
	}, [readPage, offset, feedId, revision, setError]);
	return { data, loading };
}
