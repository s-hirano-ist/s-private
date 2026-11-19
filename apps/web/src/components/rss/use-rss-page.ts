import type { loadRss } from "@/application-services/rss/client";
import type { RssPage } from "@s-hirano-ist/s-api-client/models";
import { useEffect, useRef, useState } from "react";

const totalFor = (page: RssPage, view: string) =>
	view === "saved" ? page.savedCount : page.unreadCount;
const unique = <T extends { id: string }>(entries: T[]) =>
	Array.from(new Map(entries.map((entry) => [entry.id, entry])).values());

// The offset is the last requested batch, while data contains the entire loaded prefix.
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
	const [failedAppend, setFailedAppend] = useState<typeof displayed | null>(
		null,
	);
	const active = useRef<{
		controller: AbortController;
		feedId: string;
		offset: number;
		readPage: typeof loadRss;
		snapshotRevision?: number;
		view: string;
	} | null>(null);
	const sameQuery = (query: typeof displayed) =>
		query.feedId === feedId &&
		query.view === view &&
		query.snapshotRevision === snapshotRevision;
	const loading = !sameQuery(displayed);
	const reloading =
		!sameQuery(settled) ||
		settled.offset !== offset ||
		settled.readPage !== readPage ||
		settled.revision !== revision;
	const loadingMore = reloading && !loading && offset > displayed.offset;
	const loadMoreError =
		failedAppend !== null &&
		sameQuery(failedAppend) &&
		failedAppend.offset === offset;
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
		if (paused || !reloading) return;
		const request = {
			offset,
			feedId,
			view,
			readPage,
			controller: new AbortController(),
			snapshotRevision,
		};
		active.current = request;
		const append =
			!loading &&
			offset === displayed.offset + 50 &&
			settled.revision === revision &&
			settled.readPage === readPage;
		const read = (at: number, boundary = snapshotRevision) =>
			readPage(
				at,
				feedId || undefined,
				view,
				request.controller.signal,
				boundary,
			);
		const check = () => {
			if (active.current !== request)
				throw new DOMException("Superseded", "AbortError");
		};
		// Refresh the complete loaded prefix together: deletes shift every later offset.
		async function readPrefix(): Promise<RssPage> {
			for (let attempt = 0; attempt < 2; attempt++) {
				const first = await read(0);
				check();
				let result = first;
				let consistent = first.offset === 0;
				const total = totalFor(first, view);
				const targetOffset = view === "feeds" ? 0 : Math.min(offset, total - 1);
				for (let at = 50; at <= targetOffset; at += 50) {
					const page = await read(
						at,
						view === "unread" ? first.snapshotRevision : undefined,
					);
					check();
					if (
						page.offset !== at ||
						totalFor(page, view) !== total ||
						(view === "unread" &&
							page.snapshotRevision !== first.snapshotRevision)
					) {
						consistent = false;
						break;
					}
					result = {
						...page,
						unread: unique([...result.unread, ...page.unread]),
						saved: unique([...result.saved, ...page.saved]),
					};
				}
				if (consistent) return result;
			}
			throw new Error("RSS list changed during reload");
		}
		async function reload() {
			let completedPage: RssPage | undefined;
			try {
				let page: RssPage;
				if (append) {
					const next = await read(offset);
					check();
					page =
						next.offset === offset &&
						totalFor(next, view) === totalFor(data, view) &&
						(view !== "unread" ||
							next.snapshotRevision === data.snapshotRevision)
							? {
									...next,
									unread: unique([...data.unread, ...next.unread]),
									saved: unique([...data.saved, ...next.saved]),
								}
							: await readPrefix();
				} else page = await readPrefix();
				check();
				completedPage = page;
				setData(page);
				setFailedAppend(null);
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
				if (loadingMore)
					setFailedAppend({ offset, feedId, view, snapshotRevision });
				else setError(true);
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
		snapshotRevision,
		paused,
		onLoaded,
		loading,
		loadingMore,
		displayed.offset,
		settled.revision,
		settled.readPage,
		data,
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
		loading,
		reloading,
		loadingMore,
		loadMoreError,
		hasMore: view !== "feeds" && data.offset + 50 < totalFor(data, view),
		invalidate: () => {
			active.current?.controller.abort();
			active.current = null;
		},
	};
}
