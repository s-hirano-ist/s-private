"use client";

import type { searchContentFromClient } from "@/application-services/search/search-content-from-client";
import type { ServerAction } from "@/common/types";
import type { ReactNode } from "react";
import { BackButton } from "@/components/common/back-button";
import {
	CreateFlowContext,
	type CreateOutcome,
} from "@/components/common/forms/create-flow-context";
import { Link } from "@/infrastructures/i18n/routing";
import { Button } from "@s-hirano-ist/s-ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@s-hirano-ist/s-ui/dialog";
import { cn } from "@s-hirano-ist/s-ui/utils/cn";
import {
	ArrowLeftRightIcon,
	BookOpenIcon,
	FileTextIcon,
	ImageIcon,
	PlusIcon,
	SearchIcon,
	SettingsIcon,
	StickyNoteIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { SearchDrawer } from "./search-drawer";
import { useViewerCount } from "./viewer-count-context";

const domains = [
	{
		key: "articles",
		href: "/articles",
		viewerHref: "/articles/viewer",
		icon: FileTextIcon,
	},
	{
		key: "notes",
		href: "/notes",
		viewerHref: "/notes/viewer",
		icon: StickyNoteIcon,
	},
	{
		key: "images",
		href: "/images",
		viewerHref: "/images/viewer",
		icon: ImageIcon,
	},
	{
		key: "books",
		href: "/books",
		viewerHref: "/books/viewer",
		icon: BookOpenIcon,
	},
] as const;

type Domain = (typeof domains)[number]["key"];

type Props = {
	forms: Record<Domain, ReactNode>;
	search: typeof searchContentFromClient;
};

function getNavigationState(pathname: string) {
	const segments = pathname.split("/").filter(Boolean);
	const route = segments[1];
	const bookDetailDomain = route === "book" ? "books" : undefined;
	const noteDetailDomain = route === "note" ? "notes" : undefined;
	const domain =
		domains.find((item) => item.key === route)?.key ??
		bookDetailDomain ??
		noteDetailDomain;
	const isViewer =
		segments.includes("viewer") ||
		bookDetailDomain !== undefined ||
		noteDetailDomain !== undefined;

	const isContent = route === "book" || route === "note";
	return { route, domain, isViewer, isContent };
}

export function AppNavigation({ forms, search }: Props) {
	const t = useTranslations("navigation");
	const pathname = usePathname();
	const [createOpen, setCreateOpen] = useState(false);
	const [createDomain, setCreateDomain] = useState<Domain | null>(null);
	const [drafts, setDrafts] = useState<Partial<Record<Domain, FormData>>>({});
	const [draftVersion, setDraftVersion] = useState(0);
	const [createPending, setCreatePending] = useState(false);
	const createPendingRef = useRef(false);
	const [searchOpen, setSearchOpen] = useState(false);
	const { route, domain, isViewer, isContent } = getNavigationState(pathname);
	const activeDomain = domains.find((item) => item.key === domain);
	const viewerCount = useViewerCount();
	const count =
		isViewer && viewerCount !== null && viewerCount.domain === domain
			? viewerCount.count
			: null;

	const submitCreate = (
		formData: FormData,
		execute: (data: FormData) => Promise<CreateOutcome>,
		afterSubmit: (response: ServerAction) => void,
	) => {
		if (createPendingRef.current || createDomain === null) return;
		const submittedDomain = createDomain;
		createPendingRef.current = true;
		setCreatePending(true);
		setCreateOpen(false);
		void (async () => {
			try {
				const { response, retryData } = await execute(formData);
				afterSubmit(response);
				if (response.success) {
					setDrafts((current) => ({
						...current,
						[submittedDomain]: undefined,
					}));
					setDraftVersion((current) => current + 1);
				} else {
					setDrafts((current) => ({
						...current,
						[submittedDomain]: retryData ?? formData,
					}));
					setCreateDomain(submittedDomain);
					setDraftVersion((current) => current + 1);
					setCreateOpen(true);
				}
			} catch {
				afterSubmit({ success: false, message: "error" });
				setDrafts((current) => ({ ...current, [submittedDomain]: formData }));
				setCreateDomain(submittedDomain);
				setDraftVersion((current) => current + 1);
				setCreateOpen(true);
			} finally {
				createPendingRef.current = false;
				setCreatePending(false);
			}
		})();
	};

	return (
		<>
			<header className="sticky top-3 z-40 mx-auto flex min-h-14 w-[calc(100%-1.5rem)] max-w-3xl flex-nowrap items-center gap-1 rounded-full border border-nav-border/10 bg-nav-surface/70 px-2 py-1 text-foreground shadow-lg backdrop-blur-xl sm:gap-2 sm:px-3">
				{activeDomain ? (
					<>
						<nav aria-label={t("status")} className="mr-auto min-w-0">
							{isContent ? (
								<BackButton />
							) : (
								<Link
									aria-label={`${t("switchStatus", {
										current: t(isViewer ? "exported" : "unexported"),
										next: t(isViewer ? "unexported" : "exported"),
									})}${count === null ? "" : t("contentCount", { count })}`}
									className="inline-flex h-8 items-center gap-1.5 rounded-full bg-primary/10 px-3 text-xs font-medium whitespace-nowrap text-foreground transition-colors duration-200 hover:bg-primary/20"
									href={isViewer ? activeDomain.href : activeDomain.viewerHref}
									onClick={() => setCreateOpen(false)}
								>
									{t(isViewer ? "exported" : "unexported")}
									{count !== null && t("contentCount", { count })}
									<ArrowLeftRightIcon aria-hidden="true" className="size-3.5" />
								</Link>
							)}
						</nav>
						<Button
							aria-label={t("create")}
							className="size-9 shrink-0 rounded-full bg-linear-to-br from-primary to-primary-grad text-primary-foreground shadow-[0_4px_20px_rgb(var(--sui-primary)/0.4)] ring-2 ring-background transition-all duration-200 hover:scale-105 hover:text-primary-foreground hover:shadow-[0_6px_28px_rgb(var(--sui-primary)/0.5)] active:scale-95"
							disabled={createPending}
							onClick={() => {
								setCreateDomain(domain ?? null);
								setCreateOpen(true);
							}}
							size="icon"
							type="button"
							variant="default"
						>
							<PlusIcon />
						</Button>
					</>
				) : (
					<h1 className="mr-auto text-base font-semibold text-foreground">
						{t("settings")}
					</h1>
				)}
				<Button
					aria-label={t("search")}
					className="shrink-0 rounded-full text-foreground transition-colors duration-200 hover:bg-primary/10"
					onClick={() => setSearchOpen(true)}
					size="icon"
					type="button"
					variant="ghost"
				>
					<SearchIcon />
				</Button>
				{route !== "settings" && (
					<Link
						aria-label={t("settings")}
						className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors duration-200 hover:bg-primary/10"
						href="/settings"
					>
						<SettingsIcon aria-hidden="true" className="size-5" />
					</Link>
				)}
			</header>
			<footer className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-full border border-nav-border/10 bg-nav-surface/70 shadow-lg backdrop-blur-xl">
				<nav
					aria-label={t("contentTypes")}
					className="grid h-14 grid-cols-4 gap-0.5 p-1"
				>
					{domains.map((item) => {
						const Icon = item.icon;
						return (
							<Link
								aria-current={domain === item.key ? "page" : undefined}
								className={cn(
									"flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-full text-[10px] text-muted-foreground transition-all duration-200 hover:bg-primary/10 hover:text-primary dark:text-foreground",
									domain === item.key &&
										"bg-primary/15 font-medium text-foreground shadow-sm",
								)}
								href={isViewer ? item.viewerHref : item.href}
								key={item.key}
								onClick={() => setCreateOpen(false)}
							>
								<Icon
									aria-hidden="true"
									className={cn(
										"size-5",
										domain === item.key && "text-primary",
									)}
								/>
								<span>{t(item.key)}</span>
							</Link>
						);
					})}
				</nav>
			</footer>
			{createDomain && (
				<CreateFlowContext
					value={{
						domain: createDomain,
						draft: drafts[createDomain],
						draftVersion,
						pending: createPending,
						submit: submitCreate,
					}}
				>
					<Dialog onOpenChange={setCreateOpen} open={createOpen}>
						<DialogContent className="max-h-[85dvh] overflow-y-auto">
							<DialogHeader>
								<DialogTitle>{t("create")}</DialogTitle>
							</DialogHeader>
							{forms[createDomain]}
						</DialogContent>
					</Dialog>
				</CreateFlowContext>
			)}
			{searchOpen && (
				<SearchDrawer
					onOpenChange={setSearchOpen}
					open={searchOpen}
					search={search}
				/>
			)}
		</>
	);
}
