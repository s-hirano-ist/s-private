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
			<header className="sticky top-0 z-40 flex min-h-14 flex-wrap items-center gap-1 border-b bg-background/95 px-3 py-1 backdrop-blur-sm sm:flex-nowrap sm:gap-2">
				{activeDomain ? (
					<>
						<h1 className="mr-auto text-base font-semibold">
							{t(activeDomain.key)}
						</h1>
						<nav
							aria-label={t("status")}
							className="order-last grid w-full grid-cols-2 rounded-lg border p-0.5 text-center text-xs sm:order-none sm:flex sm:w-auto sm:text-sm"
						>
							<Link
								aria-current={isViewer ? undefined : "page"}
								className={cn(
									"rounded-md px-2 py-1.5",
									!isViewer && "bg-primary text-primary-foreground",
								)}
								href={activeDomain.href}
								onClick={() => setCreateOpen(false)}
							>
								{t("unexported")}
							</Link>
							<Link
								aria-current={isViewer ? "page" : undefined}
								className={cn(
									"rounded-md px-2 py-1.5",
									isViewer && "bg-primary text-primary-foreground",
								)}
								href={activeDomain.viewerHref}
								onClick={() => setCreateOpen(false)}
							>
								{t("exported")}
							</Link>
						</nav>
						<Button
							aria-label={t("create")}
							onClick={() => setCreateOpen(true)}
							size="icon"
							type="button"
							variant="ghost"
						>
							<PlusIcon />
						</Button>
					</>
				) : (
					<h1 className="mr-auto text-base font-semibold">{t("settings")}</h1>
				)}
				<Button
					aria-label={t("search")}
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
						className="inline-flex size-9 items-center justify-center rounded-md hover:bg-accent"
						href="/settings"
					>
						<SettingsIcon aria-hidden="true" className="size-5" />
					</Link>
				)}
			</header>
			<footer className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm">
				<nav
					aria-label={t("contentTypes")}
					className="mx-auto grid h-16 max-w-5xl grid-cols-4"
				>
					{domains.map((item) => {
						const Icon = item.icon;
						return (
							<Link
								aria-current={domain === item.key ? "page" : undefined}
								className={cn(
									"flex min-w-0 flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground",
									domain === item.key && "font-semibold text-primary",
								)}
								href={isViewer ? item.viewerHref : item.href}
								key={item.key}
								onClick={() => setCreateOpen(false)}
							>
								<Icon aria-hidden="true" className="size-5" />
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
