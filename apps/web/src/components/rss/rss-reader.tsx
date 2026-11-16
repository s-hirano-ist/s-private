"use client";
import type * as actions from "@/application-services/rss/actions";
import type {
	RssPage,
	RssUnread,
	RssSaved,
} from "@s-hirano-ist/s-api-client/models";
import { loadRss, refreshRss } from "@/application-services/rss/client";
import { ViewerCountSync } from "@/components/common/layouts/nav/viewer-count-context";
import { refreshFeeds } from "@/components/rss/refresh-feeds";
import { RssLoading } from "@/components/rss/rss-loading";
import { useRssPage } from "@/components/rss/use-rss-page";
import { Button } from "@s-hirano-ist/s-ui/button";
import { Input } from "@s-hirano-ist/s-ui/input";
import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
type RssActions = Omit<typeof actions, "loadRss"> & {
	loadRss?: typeof loadRss;
	refreshRss?: typeof refreshRss;
};
function entriesForView(data: RssPage, view: "unread" | "saved" | "feeds") {
	return view === "saved"
		? { entries: data.saved, total: data.savedCount }
		: { entries: data.unread, total: data.unreadCount };
}

function RssRefreshButton({
	refreshing,
	busy,
	progress,
	onRefresh,
}: {
	busy: boolean;
	onRefresh: () => void;
	progress: string;
	refreshing: boolean;
}) {
	const t = useTranslations("rss");
	return (
		<Button
			aria-label={refreshing ? `${t("refreshing")} ${progress}` : t("refresh")}
			aria-busy={refreshing}
			variant="outline"
			className="gap-2"
			disabled={refreshing || busy}
			onClick={onRefresh}
			type="button"
		>
			<span
				aria-hidden="true"
				className={
					refreshing
						? "inline-flex animate-spin motion-reduce:animate-none"
						: "inline-flex"
				}
			>
				<RefreshCw className="size-4" />
			</span>
			<span aria-live="polite">{refreshing ? progress : t("refresh")}</span>
		</Button>
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
	const [refreshing, setRefreshing] = useState(false);
	const [progress, setProgress] = useState("");
	const [error, setError] = useState(false);
	const readPage = services.loadRss ?? loadRss;
	const { data, loading, reloading } = useRssPage(
		initialData,
		readPage,
		offset,
		feedId,
		revision,
		setError,
	);
	const [importResult, setImportResult] = useState<{
		added: number;
		duplicates: number;
		invalid: number;
	} | null>(null);
	const started = useRef(false);
	const refreshLock = useRef(false);
	const queuedRefresh = useRef<{ force: boolean; ids: string[] } | null>(null);
	const mounted = useRef(true);
	const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
			if (reloadTimer.current) clearTimeout(reloadTimer.current);
			reloadTimer.current = null;
		};
	}, []);
	function scheduleReload() {
		if (reloadTimer.current) return;
		reloadTimer.current = setTimeout(() => {
			reloadTimer.current = null;
			if (mounted.current) setRevision((value) => value + 1);
		}, 1000);
	}
	async function refresh(ids: string[], force: boolean) {
		if (refreshLock.current) {
			const queued = queuedRefresh.current;
			queuedRefresh.current = {
				ids: [...new Set([...(queued?.ids ?? []), ...ids])],
				force: force || (queued?.force ?? false),
			};
			return;
		}
		refreshLock.current = true;
		setRefreshing(true);
		setProgress(`0 / ${ids.length}`);
		setError(false);
		try {
			await refreshFeeds(
				ids,
				force,
				services.refreshRss ?? refreshRss,
				(completed, failed) => {
					if (!mounted.current) return;
					if (failed) setError(true);
					setProgress(`${completed} / ${ids.length}`);
					scheduleReload();
				},
			);
		} finally {
			refreshLock.current = false;
			if (reloadTimer.current) clearTimeout(reloadTimer.current);
			reloadTimer.current = null;
			if (mounted.current) {
				setRevision((value) => value + 1);
				setRefreshing(false);
				setProgress("");
				const queued = queuedRefresh.current;
				queuedRefresh.current = null;
				if (queued) void refresh(queued.ids, queued.force);
			}
		}
	}
	useEffect(() => {
		if (started.current) return;
		started.current = true;
		void refresh(
			initialData.feeds.map((feed) => feed.id),
			false,
		);
		// Startup fetch runs once; filtering and pagination never trigger another feed poll.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	async function perform(work: () => Promise<unknown>) {
		setBusy(true);
		setError(false);
		try {
			await work();
			setRevision((value) => value + 1);
		} catch {
			setError(true);
		} finally {
			setBusy(false);
		}
	}
	function openEntry(entry: RssUnread | RssSaved) {
		if ("feedId" in entry)
			void perform(() => services.markRssRead({ ids: [entry.id] }));
	}
	const { entries, total } = entriesForView(data, view);

	const status = !refreshing && (reloading || busy) ? t("loading") : "";
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
					busy={busy}
					progress={progress}
					onRefresh={() => {
						void refresh(
							data.feeds.map((feed) => feed.id),
							true,
						);
					}}
				/>
				{view === "unread" ? (
					<div className="contents">
						<label className="order-first col-span-2 block min-w-0 sm:order-none sm:flex-1">
							<span className="sr-only">{t("filter")}</span>
							<select
								className="h-9 w-full min-w-0 rounded-md border bg-background px-3 text-sm"
								value={feedId}
								onChange={(event) => {
									setFeedId(event.target.value);
									setOffset(0);
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
							onClick={() => {
								const before = new Date().toISOString();
								void perform(() =>
									services.markRssRead({
										before,
										...(feedId ? { feedId } : {}),
									}),
								);
							}}
							type="button"
							variant="outline"
						>
							{t("readAll")}
						</Button>
					</div>
				) : null}
				<RssLoading display="inline" label={status} />
			</div>
			{error ? (
				<div className="rounded-xl border border-destructive p-4" role="alert">
					{t("error")}{" "}
					<Button
						onClick={() => {
							setError(false);
							setRevision((value) => value + 1);
						}}
						type="button"
						variant="outline"
					>
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
							void perform(async () => {
								await services.subscribeRss({
									url: field("url"),
									title: field("title") || field("url"),
									folder: field("folder"),
								});
								form.reset();
								const page = await readPage();
								void refresh(
									page.feeds.map((feed) => feed.id),
									false,
								);
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
								disabled={busy}
								type="file"
								onChange={(event) => {
									const file = event.target.files?.[0];
									if (!file) return;
									setImportResult(null);
									void perform(async () => {
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
										const page = await readPage();
										void refresh(
											page.feeds.map((feed) => feed.id),
											false,
										);
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
												void perform(() => services.unsubscribeRss(feed.id));
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
								<li
									className="flex min-w-0 flex-col gap-3 rounded-xl border border-muted border-l-3 border-l-primary/40 bg-primary-foreground p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
									key={entry.id}
								>
									<a
										className="block break-words font-bold text-foreground underline-offset-4 hover:underline"
										href={entry.url}
										target="_blank"
										rel="noopener noreferrer"
										onClick={() => openEntry(entry)}
										onAuxClick={(event) => {
											if (event.button === 1) openEntry(entry);
										}}
									>
										{entry.title}
									</a>
									<p className="break-all text-sm text-muted-foreground">
										{new URL(entry.url).hostname}
										{entry.publishedAt
											? ` · ${entry.publishedAt.slice(0, 10)}`
											: ""}
									</p>
									<div className="mt-auto flex flex-wrap gap-2 pt-1">
										{"feedId" in entry ? (
											<>
												<Button
													disabled={busy}
													onClick={() => {
														void perform(() =>
															services.saveRss({
																url: entry.url,
																title: entry.title,
																publishedAt: entry.publishedAt,
															}),
														);
													}}
													type="button"
													variant="outline"
												>
													{t("save")}
												</Button>
												<Button
													disabled={busy}
													onClick={() => {
														void perform(() =>
															services.markRssRead({ ids: [entry.id] }),
														);
													}}
													type="button"
													variant="ghost"
												>
													{t("read")}
												</Button>
											</>
										) : (
											<Button
												disabled={busy}
												onClick={() => {
													void perform(() => services.unsaveRss(entry.id));
												}}
												type="button"
												variant="outline"
											>
												{t("unsave")}
											</Button>
										)}
									</div>
								</li>
							))}
						</ul>
					) : (
						<p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
							{t(view === "unread" ? "emptyUnread" : "emptySaved")}
						</p>
					)}
					<div className="flex items-center justify-between gap-3">
						<Button
							disabled={loading || offset === 0}
							onClick={() => setOffset(Math.max(0, offset - 50))}
							type="button"
							variant="outline"
						>
							{t("previous")}
						</Button>
						<span className="text-sm text-muted-foreground">
							{total ? Math.min(offset + 1, total) : 0}–
							{Math.min(offset + 50, total)} / {total}
						</span>
						<Button
							disabled={loading || offset + 50 >= total}
							onClick={() => setOffset(offset + 50)}
							type="button"
							variant="outline"
						>
							{t("next")}
						</Button>
					</div>
				</section>
			)}
		</main>
	);
}
