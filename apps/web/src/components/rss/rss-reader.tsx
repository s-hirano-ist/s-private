"use client";
import type * as actions from "@/application-services/rss/actions";
import type {
	RssPage,
	RssUnread,
	RssSaved,
} from "@s-hirano-ist/s-api-client/models";
import { loadRss } from "@/application-services/rss/client";
import { ViewerCountSync } from "@/components/common/layouts/nav/viewer-count-context";
import { RssLoading } from "@/components/rss/rss-loading";
import { useRssPage } from "@/components/rss/use-rss-page";
import { Button } from "@s-hirano-ist/s-ui/button";
import { useInfiniteScroll } from "@s-hirano-ist/s-ui/hooks/use-infinite-scroll";
import { Input } from "@s-hirano-ist/s-ui/input";
import { RefreshCw, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import NextImage from "next/image";
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
// No external changes: React switches from the server snapshot after hydration.
const subscribeToHydration = () => () => {
	// Hydration has no external subscription to dispose.
};

type RssActions = Omit<typeof actions, "loadRss"> & {
	loadRss?: typeof loadRss;
};
function entriesForView(data: RssPage, view: "unread" | "saved" | "feeds") {
	return view === "saved"
		? { entries: data.saved, total: data.savedCount }
		: { entries: data.unread, total: data.unreadCount };
}

function savedIdFor(entry: RssUnread | RssSaved): string | null {
	return "feedId" in entry ? (entry.savedId ?? null) : entry.id;
}

function RssRefreshButton({
	refreshing,
	busy,
	onRefresh,
}: {
	busy: boolean;
	onRefresh: () => void;
	refreshing: boolean;
}) {
	const t = useTranslations("rss");
	return (
		<Button
			aria-label={refreshing ? t("refreshing") : t("refresh")}
			aria-busy={refreshing}
			variant="outline"
			className="gap-2"
			disabled={refreshing || busy}
			onClick={onRefresh}
			type="button"
		>
			<RefreshCw aria-hidden="true" className="size-4" />
			<span aria-live="polite">
				{refreshing ? t("refreshing") : t("refresh")}
			</span>
		</Button>
	);
}

function RssEntryCard({
	entry,
	source,
	savedId,
	busy,
	loading,
	onOpen,
	onToggle,
}: {
	busy: boolean;
	entry: RssUnread | RssSaved;
	loading: boolean;
	onOpen: () => void;
	onToggle: () => void;
	savedId: string | null;
	source: string;
}) {
	const t = useTranslations("rss");
	const [failedImage, setFailedImage] = useState<string | null>(null);
	return (
		<li className="min-w-0 rounded-xl border border-muted bg-primary-foreground p-3 transition-colors hover:border-primary/30 sm:p-4">
			<div className="mb-1 flex min-w-0 items-center gap-2">
				<p
					className="min-w-0 flex-1 truncate text-xs text-muted-foreground"
					title={source}
				>
					{source}
					{entry.publishedAt ? ` · ${entry.publishedAt.slice(0, 10)}` : ""}
				</p>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="size-9 shrink-0 text-primary"
					aria-label={t(savedId ? "unsave" : "save")}
					aria-pressed={Boolean(savedId)}
					title={t(savedId ? "unsave" : "save")}
					disabled={busy}
					onClick={onToggle}
				>
					<Star
						aria-hidden="true"
						className="size-4"
						fill={savedId ? "currentColor" : "none"}
					/>
				</Button>
			</div>
			<a
				className="flex min-w-0 items-start gap-3 rounded-sm text-foreground underline-offset-4 hover:underline"
				href={entry.url}
				target="_blank"
				rel="noopener noreferrer"
				aria-disabled={loading}
				onClick={(event) => {
					if (loading) event.preventDefault();
					else onOpen();
				}}
				onAuxClick={(event) => {
					if (loading) event.preventDefault();
					else if (event.button === 1) onOpen();
				}}
			>
				<h2 className="min-w-0 flex-1 text-sm leading-relaxed font-semibold break-words sm:text-base">
					{entry.title}
				</h2>
				{entry.imageUrl && failedImage !== entry.imageUrl ? (
					<NextImage
						src={entry.imageUrl}
						width={80}
						height={80}
						sizes="80px"
						alt=""
						referrerPolicy="no-referrer"
						className="size-18 shrink-0 rounded-lg bg-muted object-cover sm:size-20"
						onError={() => setFailedImage(entry.imageUrl ?? null)}
					/>
				) : null}
			</a>
		</li>
	);
}

function useRssMutations(
	isMounted: () => boolean,
	invalidate: () => void,
	setError: (value: boolean) => void,
	setBusy: (value: boolean) => void,
	setRevision: (value: (previous: number) => number) => void,
) {
	const mutationQueue = useRef(Promise.resolve());
	const pendingMutations = useRef(new Set<string>());
	return function perform(work: () => Promise<unknown>, key = "form") {
		if (pendingMutations.current.has(key)) return;
		if (pendingMutations.current.size === 0) setError(false);
		pendingMutations.current.add(key);
		invalidate();
		setBusy(true);
		const execute = async () => {
			if (!isMounted()) return;
			try {
				await work();
			} catch {
				if (isMounted()) setError(true);
			} finally {
				pendingMutations.current.delete(key);
				if (isMounted()) {
					setRevision((value) => value + 1);
					setBusy(pendingMutations.current.size > 0);
				}
			}
		};
		mutationQueue.current = mutationQueue.current.then(execute);
	};
}

function RssUnreadControls({
	data,
	feedId,
	busy,
	loading,
	onReadAll,
	onSelect,
}: {
	busy: boolean;
	data: RssPage;
	feedId: string;
	loading: boolean;
	onReadAll: () => void;
	onSelect: (value: string) => void;
}) {
	const t = useTranslations("rss");
	return (
		<div className="contents">
			<label className="order-first col-span-2 block min-w-0 sm:order-none sm:flex-1">
				<span className="sr-only">{t("filter")}</span>
				<select
					className="h-9 w-full min-w-0 rounded-md border bg-background px-3 text-sm"
					value={feedId}
					onChange={(event) => {
						onSelect(event.target.value);
					}}
				>
					<option value="">{t("allFeeds")}</option>
					{data.feeds.map((feed) => (
						<option key={feed.id} value={feed.id}>
							{feed.folder ? `${feed.folder} / ` : ""}
							{feed.title}
						</option>
					))}
				</select>
			</label>
			<Button
				className="justify-self-end"
				disabled={busy || loading || !data.unreadCount}
				onClick={onReadAll}
				type="button"
				variant="outline"
			>
				{t("readAll")}
			</Button>
		</div>
	);
}

function RssNewArrivals({
	count,
	busy,
	loading,
	onShow,
}: {
	busy: boolean;
	count: number;
	loading: boolean;
	onShow: () => void;
}) {
	const t = useTranslations("rss");
	if (count === 0) return null;
	return (
		<Button
			className="col-span-2 justify-self-start sm:col-auto"
			type="button"
			variant="outline"
			disabled={busy || loading}
			onClick={onShow}
		>
			{t("showNew", { count })}
		</Button>
	);
}

function RssLoadMore({
	count,
	total,
	loading,
	error,
	hasMore,
	disabled,
	onLoadMore,
	onRetry,
	tailRef,
}: {
	count: number;
	disabled: boolean;
	error: boolean;
	hasMore: boolean;
	loading: boolean;
	onLoadMore: () => void;
	onRetry: () => void;
	tailRef: (node: HTMLElement | null) => void;
	total: number;
}) {
	const t = useTranslations("rss");
	return (
		<div className="flex flex-col items-center gap-2" ref={tailRef}>
			<p className="text-sm text-muted-foreground">
				{t("loadedCount", { count, total })}
			</p>
			<RssLoading display="inline" label={loading ? t("loading") : ""} />
			{error ? (
				<p role="alert" className="text-sm text-destructive">
					{t("error")}
				</p>
			) : null}
			{hasMore || error ? (
				<Button
					type="button"
					variant="outline"
					disabled={disabled}
					onClick={error ? onRetry : onLoadMore}
				>
					{t(error ? "retry" : "loadMore")}
				</Button>
			) : null}
		</div>
	);
}

export function RssReader({
	initialData,
	view = "unread",
	services,
}: {
	initialData: RssPage;
	services: RssActions;
	view?: "unread" | "saved" | "feeds";
}) {
	const t = useTranslations("rss");
	const [feedId, setFeedId] = useState("");
	const [offset, setOffset] = useState(0);
	const [revision, setRevision] = useState(0);
	const [busy, setBusy] = useState(false);
	const interactive = useSyncExternalStore(
		subscribeToHydration,
		() => true,
		() => false,
	);
	const [error, setError] = useState(false);
	const [pageError, setPageError] = useState(false);
	const readPage = services.loadRss ?? loadRss;
	const [snapshotRevision, setSnapshotRevision] = useState<number | undefined>(
		initialData.snapshotRevision,
	);
	const onLoaded = useCallback(
		(page: RssPage) => {
			setOffset(page.offset);
			if (view === "unread") setSnapshotRevision(page.snapshotRevision);
		},
		[view],
	);
	const {
		data,
		loading,
		reloading,
		loadingMore,
		loadMoreError,
		hasMore,
		invalidate,
	} = useRssPage(
		initialData,
		readPage,
		offset,
		feedId,
		revision,
		setPageError,
		view,
		view === "unread" ? snapshotRevision : undefined,
		busy,
		onLoaded,
	);
	const [importResult, setImportResult] = useState<{
		added: number;
		duplicates: number;
		invalid: number;
	} | null>(null);
	const mounted = useRef(true);
	useEffect(() => {
		mounted.current = true;
		// Only DB reads run in the reader. Feed polling belongs to the server Cron.
		const reload = () => {
			if (document.visibilityState === "visible")
				setRevision((value) => value + 1);
		};
		const timer = setInterval(reload, 60_000);
		document.addEventListener("visibilitychange", reload);
		window.addEventListener("focus", reload);
		return () => {
			mounted.current = false;
			clearInterval(timer);
			document.removeEventListener("visibilitychange", reload);
			window.removeEventListener("focus", reload);
		};
	}, []);
	const perform = useRssMutations(
		() => mounted.current,
		invalidate,
		setError,
		setBusy,
		setRevision,
	);

	function openEntry(entry: RssUnread | RssSaved) {
		if ("feedId" in entry)
			perform(
				() => services.markRssRead({ ids: [entry.id] }),
				`read:${entry.id}`,
			);
	}
	function toggleSaved(entry: RssUnread | RssSaved) {
		const id = savedIdFor(entry);
		if (id) {
			perform(() => services.unsaveRss(id));
			return;
		}
		perform(() =>
			services.saveRss({
				url: entry.url,
				title: entry.title,
				publishedAt: entry.publishedAt,
				...(entry.imageUrl ? { imageUrl: entry.imageUrl } : {}),
			}),
		);
	}

	const { entries } = entriesForView(data, view);
	const sources = new Map(data.feeds.map((feed) => [feed.id, feed.title]));

	function retry() {
		setError(false);
		setPageError(false);
		setRevision((value) => value + 1);
	}
	const controlsBusy = busy || !interactive;
	const controlsLoading = loading || !interactive;
	const canLoadMore =
		hasMore &&
		![controlsBusy, loading, reloading, loadMoreError, pageError].some(Boolean);
	const fetchNextPage = async () => {
		if (canLoadMore) setOffset(data.offset + 50);
	};
	const { lastElementRef } = useInfiniteScroll({
		hasNextPage: canLoadMore,
		isFetchingNextPage: reloading || busy,
		fetchNextPage,
	});
	const refreshing = reloading && !loadingMore;
	const status = [refreshing, busy].some(Boolean) ? t("loading") : "";
	return (
		<main
			className="space-y-4 bg-background px-3 pt-6 text-foreground sm:px-0"
			aria-label={t(view === "feeds" ? "feeds" : "title")}
		>
			<ViewerCountSync domain="rss" count={entriesForView(data, view).total} />
			<div
				className={
					view === "feeds"
						? "mx-auto flex max-w-3xl flex-wrap items-center justify-end gap-2"
						: "grid grid-cols-[auto_1fr] items-center gap-2 sm:flex"
				}
			>
				<RssRefreshButton
					refreshing={refreshing}
					busy={controlsBusy}
					onRefresh={retry}
				/>
				{view === "unread" ? (
					<RssUnreadControls
						data={data}
						feedId={feedId}
						busy={controlsBusy}
						loading={controlsLoading}
						onSelect={(value) => {
							setFeedId(value);
							setOffset(0);
							setPageError(false);
							window.scrollTo({ top: 0 });
						}}
						onReadAll={() => {
							const boundary = data.snapshotRevision;
							perform(() =>
								services.markRssRead({
									snapshotRevision: boundary,
									...(feedId ? { feedId } : {}),
								}),
							);
						}}
					/>
				) : null}
				<RssLoading display="inline" label={status} />
				{view === "unread" ? (
					<RssNewArrivals
						count={data.newerCount}
						busy={controlsBusy}
						loading={controlsLoading}
						onShow={() => {
							setOffset(0);
							setSnapshotRevision(undefined);
							window.scrollTo({ top: 0 });
						}}
					/>
				) : null}
			</div>
			{[error, pageError].some(Boolean) ? (
				<div className="rounded-xl border border-destructive p-4" role="alert">
					{t("error")}{" "}
					<Button onClick={retry} type="button" variant="outline">
						{t("retry")}
					</Button>
				</div>
			) : null}
			{view === "feeds" ? (
				<section
					className="mx-auto max-w-3xl space-y-4"
					aria-label={t("feeds")}
				>
					<form
						className="space-y-4 rounded-xl border bg-primary-foreground p-4 sm:p-6"
						onSubmit={(event) => {
							event.preventDefault();
							const form = event.currentTarget;
							const fields = new FormData(form);
							const field = (name: string) => {
								const value = fields.get(name);
								return typeof value === "string" ? value : "";
							};
							perform(async () => {
								await services.subscribeRss({
									url: field("url"),
									title: field("title") || field("url"),
									folder: field("folder"),
								});
								form.reset();
							});
						}}
					>
						<h2 className="font-medium">{t("addFeed")}</h2>
						<label className="grid gap-2 text-sm font-medium">
							{t("feedUrl")}
							<Input name="url" required type="url" maxLength={2048} />
						</label>
						<label className="grid gap-2 text-sm font-medium">
							{t("feedTitle")}
							<Input name="title" maxLength={512} />
						</label>
						<label className="grid gap-2 text-sm font-medium">
							{t("folder")}
							<Input name="folder" maxLength={512} />
						</label>
						<Button disabled={busy} type="submit">
							{t("subscribe")}
						</Button>
					</form>
					<div className="space-y-4 rounded-xl border bg-primary-foreground p-4 sm:p-6">
						<h2 className="font-medium">{t("import")}</h2>
						<p className="text-sm text-muted-foreground">{t("importHelp")}</p>
						<label className="grid gap-2 text-sm font-medium">
							{t("importFile")}
							<Input
								accept=".zip,.xml,.opml,.json"
								disabled={controlsBusy}
								type="file"
								onChange={(event) => {
									const file = event.target.files?.[0];
									if (!file) return;
									setImportResult(null);
									perform(async () => {
										const { readImportFile, importBatches } =
											await import("@/components/rss/import-file");
										const batches = importBatches(await readImportFile(file));
										const summary = { added: 0, duplicates: 0, invalid: 0 };
										for (const batch of batches) {
											const result = await services.importRss(
												batch.kind,
												batch.content,
											);
											summary.added += result.added;
											summary.duplicates += result.duplicates;
											summary.invalid += result.invalid;
											setImportResult({ ...summary });
										}
									});
								}}
							/>
						</label>
						{importResult ? (
							<output className="block">
								{t("importResult", importResult)}
							</output>
						) : null}
					</div>
					<ul className="divide-y rounded-xl border">
						{data.feeds.map((feed) => (
							<li className="space-y-2 p-4 sm:p-6" key={feed.id}>
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<h3 className="break-words font-medium">{feed.title}</h3>
										<p className="break-all text-sm text-muted-foreground">
											{feed.url}
										</p>
										{feed.folder ? (
											<p className="text-sm">{feed.folder}</p>
										) : null}
									</div>
									<Button
										disabled={busy}
										onClick={() => {
											if (window.confirm(t("confirmUnsubscribe")))
												perform(() => services.unsubscribeRss(feed.id));
										}}
										type="button"
										variant="outline"
									>
										{t("unsubscribe")}
									</Button>
								</div>
								<p className="text-sm text-muted-foreground">
									{feed.lastFetchedAt
										? `${t("lastFetched")} ${feed.lastFetchedAt.replace("T", " ").slice(0, 16)} UTC`
										: t("notFetched")}
								</p>
								{feed.error ? (
									<p className="text-sm text-destructive">{t("feedError")}</p>
								) : null}
							</li>
						))}
					</ul>
				</section>
			) : (
				<section className="space-y-4" aria-label={t(view)}>
					{entries.length > 0 ? (
						<ul className="grid grid-cols-1 items-stretch gap-2 sm:grid-cols-2 sm:gap-4">
							{entries.map((entry) => (
								<RssEntryCard
									key={entry.id}
									entry={entry}
									busy={controlsBusy || loading}
									loading={controlsLoading}
									source={
										("feedId" in entry ? sources.get(entry.feedId) : null) ??
										new URL(entry.url).hostname
									}
									savedId={savedIdFor(entry)}
									onOpen={() => openEntry(entry)}
									onToggle={() => toggleSaved(entry)}
								/>
							))}
						</ul>
					) : (
						<p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
							{t(view === "unread" ? "emptyUnread" : "emptySaved")}
						</p>
					)}
					<RssLoadMore
						count={entries.length}
						total={entriesForView(data, view).total}
						loading={loadingMore}
						error={loadMoreError}
						hasMore={hasMore}
						disabled={loadMoreError ? controlsBusy || reloading : !canLoadMore}
						onLoadMore={() => {
							void fetchNextPage();
						}}
						onRetry={retry}
						tailRef={lastElementRef}
					/>
				</section>
			)}
		</main>
	);
}
