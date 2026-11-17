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
	view: "unread" | "saved" | "feeds" = "unread",
) {
	const [data, setData] = useState(initialData);
	const [displayed, setDisplayed] = useState({ offset: 0, feedId: "", view });
	const [settled, setSettled] = useState({
		offset: 0,
		feedId: "",
		view,
		readPage,
		revision: 0,
	});
	const active = useRef<{
		controller: AbortController;
		feedId: string;
		offset: number;
		readPage: typeof loadRss;
		view: string;
	} | null>(null);
	const pageChanged =
		displayed.offset !== offset ||
		displayed.feedId !== feedId ||
		displayed.view !== view;
	const reloading =
		settled.offset !== offset ||
		settled.feedId !== feedId ||
		settled.view !== view ||
		settled.readPage !== readPage ||
		settled.revision !== revision;
	useEffect(() => {
		const pending = active.current;
		if (pending) {
			if (
				pending.offset === offset &&
				pending.feedId === feedId &&
				pending.view === view &&
				pending.readPage === readPage
			)
				return;
			pending.controller.abort();
			active.current = null;
		}
		if (!reloading && settled.revision === revision) return;
		const request = {
			offset,
			feedId,
			view,
			readPage,
			controller: new AbortController(),
		};
		active.current = request;
		async function reload() {
			try {
				const page = await readPage(
					offset,
					feedId || undefined,
					view,
					request.controller.signal,
				);
				if (active.current !== request) return;
				setData(page);
				setDisplayed({ offset, feedId, view });
			} catch {
				if (active.current !== request) return;
				setError(true);
			} finally {
				if (active.current === request) {
					active.current = null;
					setSettled({ offset, feedId, view, readPage, revision });
				}
			}
		}
		void reload();
	}, [readPage, offset, feedId, view, revision, setError, reloading, settled]);
	useEffect(
		() => () => {
			active.current?.controller.abort();
			active.current = null;
		},
		[],
	);
	return { data, loading: pageChanged && reloading, reloading };
}
