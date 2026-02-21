"use client";
import { Button } from "@s-hirano-ist/s-ui/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from "@s-hirano-ist/s-ui/ui/drawer";
import { cn } from "@s-hirano-ist/s-ui/utils/cn";
import { DownloadIcon, SearchIcon, UploadIcon } from "lucide-react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
	type ReactNode,
	useEffect,
	useOptimistic,
	useState,
	useTransition,
} from "react";
import type { searchContentFromClient } from "@/application-services/search/search-content-from-client";
import { SearchCard } from "../../features/search/search-card";

const LAYOUTS = {
	dumper: "DUMPER",
	viewer: "VIEWER",
} as const;

const LAYOUT_KEYS = new Set(Object.keys(LAYOUTS));

const DEFAULT_LAYOUT = "dumper";

type Props = {
	search: typeof searchContentFromClient;
};
export function Footer({ search }: Props) {
	const [open, setOpen] = useState(false);

	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();

	// Derive layout from searchParams - single source of truth
	const layoutParam = searchParams.get("layout");
	const layout =
		layoutParam && LAYOUT_KEYS.has(layoutParam) ? layoutParam : DEFAULT_LAYOUT;

	// Use optimistic for perceived performance
	const [optimisticLayout, setOptimisticLayout] = useOptimistic(layout);

	// Prefetch both layout routes on component mount
	useEffect(() => {
		const currentParams = new URLSearchParams(searchParams);
		Object.keys(LAYOUTS).forEach((layoutKey) => {
			if (layoutKey !== layout) {
				const prefetchParams = new URLSearchParams(currentParams);
				prefetchParams.set("layout", layoutKey);
				prefetchParams.delete("page");
				router.prefetch(`?${prefetchParams.toString()}`);
			}
		});
	}, [router, searchParams, layout]);

	function Icon(name: string, icon: ReactNode, isActive?: boolean) {
		return (
			<div
				className={cn(
					"flex flex-col items-center gap-0.5 transition-colors duration-200",
					isActive && "text-primary",
				)}
			>
				{icon}
				<div
					className={cn(
						"text-[10px]",
						isActive
							? "font-medium text-primary"
							: "font-normal text-muted-foreground",
					)}
				>
					{name}
				</div>
			</div>
		);
	}

	const handleLayoutChange = (value: string) => {
		startTransition(() => {
			setOptimisticLayout(value);
			const params = new URLSearchParams(searchParams);
			params.delete("page");
			params.set("layout", value);

			// If we're on a book or note detail page, navigate back to root
			if (pathname.includes("/book/") || pathname.includes("/note/")) {
				// Extract locale from pathname (e.g., /en/book/... or /ja/note/...)
				const localeMatch = pathname.match(/^\/([^/]+)/);
				const locale = localeMatch ? localeMatch[1] : "";
				router.replace(`/${locale}?${params.toString()}` as Route);
			} else {
				router.replace(`?${params.toString()}` as Route);
			}
		});
	};

	// Redirect invalid layout values
	useEffect(() => {
		const currentLayout = searchParams.get("layout");
		if (currentLayout && !LAYOUT_KEYS.has(currentLayout)) {
			const params = new URLSearchParams(searchParams);
			params.delete("layout");
			router.replace(`?${params.toString()}`);
		}
	}, [searchParams, router]);

	const isDumperActive = optimisticLayout === "dumper";
	const isViewerActive = optimisticLayout === "viewer";

	const navigationButtons = (
		<div className="mx-auto grid h-14 max-w-lg grid-cols-3 items-center rounded-full text-foreground">
			<Button
				asChild
				className={cn(
					isDumperActive && "bg-primary/15",
					isPending && !isDumperActive && "opacity-50",
				)}
				disabled={isPending}
				onClick={() => handleLayoutChange("dumper")}
				size="navSide"
				variant="navSide"
			>
				{Icon("DUMPER", <UploadIcon className="size-5" />, isDumperActive)}
			</Button>
			<div className="flex items-center justify-center">
				<Button
					className="-mt-5"
					onClick={() => setOpen(true)}
					size="navCenter"
					type="button"
					variant="navCenter"
				>
					<SearchIcon className="size-5 text-white" />
					<span className="sr-only">Action</span>
				</Button>
			</div>
			<Button
				asChild
				className={cn(
					isViewerActive && "bg-primary/15",
					isPending && !isViewerActive && "opacity-50",
				)}
				disabled={isPending}
				onClick={() => handleLayoutChange("viewer")}
				size="navSide"
				variant="navSide"
			>
				{Icon("VIEWER", <DownloadIcon className="size-5" />, isViewerActive)}
			</Button>
		</div>
	);

	return (
		<>
			<footer className="fixed bottom-3 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-full border border-white/20 bg-white/70 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/70">
				{navigationButtons}
			</footer>
			<Drawer onOpenChange={setOpen} open={open}>
				<DrawerContent className="max-h-[80vh]">
					<DrawerHeader className="sr-only">
						<DrawerTitle>Search</DrawerTitle>
					</DrawerHeader>
					<SearchCard search={search} />
				</DrawerContent>
			</Drawer>
		</>
	);
}
