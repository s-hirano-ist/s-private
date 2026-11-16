"use client";
import type * as actions from "@/application-services/rss/actions";
import type {
	RssPage,
	RssUnread,
	RssSaved,
} from "@s-hirano-ist/s-api-client/models";
import { refreshRss } from "@/application-services/rss/client";
import { ViewerCountSync } from "@/components/common/layouts/nav/viewer-count-context";
import { refreshFeeds } from "@/components/rss/refresh-feeds";
import { Button } from "@s-hirano-ist/s-ui/button";
import { Input } from "@s-hirano-ist/s-ui/input";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
type RssActions = typeof actions & { refreshRss?: typeof refreshRss };
function entriesForView(data: RssPage, view: "unread" | "saved" | "feeds") {
	return view === "saved"
		? { entries: data.saved, total: data.savedCount }
		: { entries: data.unread, total: data.unreadCount };
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
	const [data, setData] = useState(initialData);
	const [feedId, setFeedId] = useState("");
	const [offset, setOffset] = useState(0);
	const [revision, setRevision] = useState(0);
	const [busy, setBusy] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [progress, setProgress] = useState("");
	const [error, setError] = useState(false);
	const [loading, startLoading] = useTransition();
	const [importResult, setImportResult] = useState<{
		added: number;
		duplicates: number;
		invalid: number;
	} | null>(null);
	const started = useRef(false);
	const refreshLock = useRef(false);
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
	useEffect(() => {
		let cancelled = false;
		startLoading(async () => {
			try {
				const page = await services.loadRss(offset, feedId || undefined);
				if (!cancelled) setData(page);
			} catch {
				if (!cancelled) setError(true);
			}
		});
		return () => {
			cancelled = true;
		};
	}, [services, offset, feedId, revision]);
	async function refresh(ids: string[], force: boolean) {
		if (refreshLock.current) return;
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

	let status = loading ? t("loading") : "";
	if (refreshing) status = `${t("refreshing")} ${progress}`;
	return (
		<main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
			<ViewerCountSync domain="rss" count={entriesForView(data, view).total} />
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold">
						{t(view === "feeds" ? "feeds" : "title")}
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{t(view === "feeds" ? "subscriptionsDescription" : "description")}
					</p>
				</div>
				<Button
					disabled={refreshing || busy}
					onClick={() => {
						void refresh(
							data.feeds.map((feed) => feed.id),
							true,
						);
					}}
					type="button"
				>
					{refreshing ? t("refreshing") : t("refresh")}
				</Button>
			</div>
			<output aria-live="polite" className="block">
				{status}
			</output>
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
				<section className="space-y-6" aria-label={t("feeds")}>
					<form
						className="space-y-3 rounded-xl border p-4"
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
								const page = await services.loadRss();
								await refresh(
									page.feeds.map((feed) => feed.id),
									false,
								);
							});
						}}
					>
						<h2 className="font-medium">{t("addFeed")}</h2>
						<label className="block">
							{t("feedUrl")}
							<Input name="url" required type="url" maxLength={2048} />
						</label>
						<label className="block">
							{t("feedTitle")}
							<Input name="title" maxLength={512} />
						</label>
						<label className="block">
							{t("folder")}
							<Input name="folder" maxLength={512} />
						</label>
						<Button disabled={busy || refreshing} type="submit">
							{t("subscribe")}
						</Button>
					</form>
					<div className="space-y-3 rounded-xl border p-4">
						<h2 className="font-medium">{t("import")}</h2>
						<p className="text-sm text-muted-foreground">{t("importHelp")}</p>
						<label className="block">
							{t("importFile")}
							<Input
								accept=".zip,.xml,.opml,.json"
								disabled={busy || refreshing}
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
										const page = await services.loadRss();
										await refresh(
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
							<li className="space-y-2 p-4" key={feed.id}>
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
										disabled={busy || refreshing}
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
					{view === "unread" ? (
						<div className="flex flex-wrap items-end justify-between gap-3">
							<label className="grid w-full min-w-0 gap-2 sm:flex sm:w-auto sm:flex-1 sm:items-center">
								{t("filter")}
								<select
									className="w-full min-w-0 rounded-md border bg-background p-2 sm:w-auto sm:flex-1"
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
					{entries.length > 0 ? (
						<ul className="divide-y rounded-xl border">
							{entries.map((entry) => (
								<li className="space-y-3 p-4" key={entry.id}>
									<a
										className="block break-words font-medium text-foreground underline-offset-4 hover:underline"
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
									<div className="flex flex-wrap gap-2">
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
