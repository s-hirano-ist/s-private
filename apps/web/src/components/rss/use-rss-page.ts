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
	snapshotRevision?: number,
	paused = false,
	onLoaded?: (page: RssPage) => void,
) {
	const [data, setData] = useState(initialData);
	const [displayed, setDisplayed] = useState({
		offset: 0,
		feedId: "",
		view,
		snapshotRevision,
	});
	const [settled, setSettled] = useState({
		offset: 0,
		feedId: "",
		view,
		readPage,
		revision: 0,
		snapshotRevision,
	});
	const active = useRef<{
		controller: AbortController;
		feedId: string;
		offset: number;
		readPage: typeof loadRss;
		snapshotRevision?: number;
		view: string;
	} | null>(null);
	const pageChanged =
		displayed.offset !== offset ||
		displayed.feedId !== feedId ||
		displayed.view !== view ||
		displayed.snapshotRevision !== snapshotRevision;
	const reloading =
		settled.offset !== offset ||
		settled.feedId !== feedId ||
		settled.view !== view ||
		settled.readPage !== readPage ||
		settled.revision !== revision ||
		settled.snapshotRevision !== snapshotRevision;
	useEffect(() => {
		const pending = active.current;
		if (pending) {
			if (
				pending.offset === offset &&
				pending.feedId === feedId &&
				pending.view === view &&
				pending.readPage === readPage &&
				pending.snapshotRevision === snapshotRevision &&
				!paused
			)
				return;
			pending.controller.abort();
			active.current = null;
		}
		if (paused || (!reloading && settled.revision === revision)) return;
		const request = {
			offset,
			feedId,
			view,
			readPage,
			controller: new AbortController(),
			snapshotRevision,
		};
		active.current = request;
		async function reload() {
			let completedPage: RssPage | undefined;
			try {
				const page = await readPage(
					offset,
					feedId || undefined,
					view,
					request.controller.signal,
					snapshotRevision,
				);
				if (active.current !== request) return;
				completedPage = page;
				setData(page);
				setDisplayed({
					offset: page.offset,
					feedId,
					view,
					snapshotRevision:
						view === "unread" && onLoaded
							? page.snapshotRevision
							: snapshotRevision,
				});
				onLoaded?.(page);
			} catch {
				if (active.current !== request) return;
				setError(true);
			} finally {
				if (active.current === request) {
					active.current = null;
					setSettled({
						offset: completedPage?.offset ?? offset,
						feedId,
						view,
						readPage,
						revision,
						snapshotRevision:
							view === "unread" && onLoaded && completedPage
								? completedPage.snapshotRevision
								: snapshotRevision,
					});
				}
			}
		}
		void reload();
	}, [
		readPage,
		offset,
		feedId,
		view,
		revision,
		setError,
		reloading,
		settled.revision,
		snapshotRevision,
		paused,
		onLoaded,
	]);
	useEffect(
		() => () => {
			active.current?.controller.abort();
			active.current = null;
		},
		[],
	);
	return {
		data,
		loading: pageChanged,
		reloading,
		invalidate: () => {
			active.current?.controller.abort();
			active.current = null;
		},
	};
}
