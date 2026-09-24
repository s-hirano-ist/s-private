"use client";

import type { searchContentFromClient } from "@/application-services/search/search-content-from-client";
import type { ReactNode } from "react";
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
import { useState } from "react";
import { SearchDrawer } from "./search-drawer";

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
	return { route, domain, isViewer };
}

export function AppNavigation({ forms, search }: Props) {
	const t = useTranslations("navigation");
	const pathname = usePathname();
	const [createOpen, setCreateOpen] = useState(false);
	const [searchOpen, setSearchOpen] = useState(false);
	const { route, domain, isViewer } = getNavigationState(pathname);
	const activeDomain = domains.find((item) => item.key === domain);

	return (
		<>
			<header className="sticky top-3 z-40 mx-auto flex min-h-14 w-[calc(100%-1.5rem)] max-w-3xl flex-nowrap items-center gap-1 rounded-full border border-white/20 bg-white/70 px-2 py-1 text-foreground shadow-lg backdrop-blur-xl sm:gap-2 sm:px-3 dark:border-white/10 dark:bg-gray-900/70">
				{activeDomain ? (
					<>
						<nav aria-label={t("status")} className="mr-auto min-w-0">
							<Link
								aria-label={t("switchStatus", {
									current: t(isViewer ? "exported" : "unexported"),
									next: t(isViewer ? "unexported" : "exported"),
								})}
								className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary/10 px-3 text-xs font-medium whitespace-nowrap text-foreground transition-colors duration-200 hover:bg-primary/20 dark:bg-white/10 dark:hover:bg-white/15"
								href={isViewer ? activeDomain.href : activeDomain.viewerHref}
								onClick={() => setCreateOpen(false)}
							>
								{t(isViewer ? "exported" : "unexported")}
								<ArrowLeftRightIcon aria-hidden="true" className="size-3.5" />
							</Link>
						</nav>
						<Button
							aria-label={t("create")}
							className="size-9 shrink-0 rounded-full bg-linear-to-br from-primary to-primary-grad text-white shadow-[0_4px_20px_rgb(var(--sui-primary)/0.4)] ring-2 ring-background transition-all duration-200 hover:scale-105 hover:text-white hover:shadow-[0_6px_28px_rgb(var(--sui-primary)/0.5)] active:scale-95"
							onClick={() => setCreateOpen(true)}
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
			<footer className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-full border border-white/20 bg-white/70 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/70">
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
			<Dialog
				onOpenChange={setCreateOpen}
				open={createOpen && domain !== undefined}
			>
				<DialogContent className="max-h-[85dvh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{t("create")}</DialogTitle>
					</DialogHeader>
					{domain ? forms[domain] : null}
				</DialogContent>
			</Dialog>
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
