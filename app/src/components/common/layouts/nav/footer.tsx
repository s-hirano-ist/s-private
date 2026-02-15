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
	memo,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
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
function FooterComponent({ search }: Props) {
	const [open, setOpen] = useState(false);

	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();

	// Derive layout from searchParams - single source of truth
	const layout = useMemo(() => {
		const param = searchParams.get("layout");
		if (param && LAYOUT_KEYS.has(param)) {
			return param;
		}
		return DEFAULT_LAYOUT;
	}, [searchParams]);

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

	const Icon = useCallback((name: string, icon: ReactNode) => {
		return (
			<div className="flex flex-col items-center">
				{icon}
				<div className="font-thin text-xs">{name}</div>
			</div>
		);
	}, []);

	const handleLayoutChange = useCallback(
		(value: string) => {
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
		},
		[router, searchParams, pathname, setOptimisticLayout],
	);

	// Redirect invalid layout values
	useEffect(() => {
		const currentLayout = searchParams.get("layout");
		if (currentLayout && !LAYOUT_KEYS.has(currentLayout)) {
			const params = new URLSearchParams(searchParams);
			params.delete("layout");
			router.replace(`?${params.toString()}`);
		}
	}, [searchParams, router]);

	const navigationButtons = useMemo(
		() => (
			<div className="mx-auto grid h-16 max-w-lg grid-cols-3 bg-linear-to-r from-primary to-primary-grad text-white sm:rounded-3xl">
				<Button
					asChild
					className={cn(
						"sm:rounded-s-3xl",
						optimisticLayout === "dumper" ? "bg-black/10" : "",
						isPending && optimisticLayout !== "dumper" ? "opacity-50" : "",
					)}
					disabled={isPending}
					onClick={() => handleLayoutChange("dumper")}
					size="navSide"
					variant="navSide"
				>
					{Icon("DUMPER", <UploadIcon className="size-6" />)}
				</Button>
				<div className="flex items-center justify-center">
					<Button
						className="bg-linear-to-t from-primary to-primary-grad shadow-sm"
						onClick={() => setOpen(true)}
						size="navCenter"
						type="button"
						variant="navCenter"
					>
						{Icon("", <SearchIcon className="size-6 text-white" />)}
						<span className="sr-only">Action</span>
					</Button>
				</div>
				<Button
					asChild
					className={cn(
						optimisticLayout === "viewer" ? "bg-black/10" : "",
						isPending && optimisticLayout !== "viewer" ? "opacity-50" : "",
					)}
					disabled={isPending}
					onClick={() => handleLayoutChange("viewer")}
					size="navSide"
					variant="navSide"
				>
					{Icon("VIEWER", <DownloadIcon className="size-6" />)}
				</Button>
			</div>
		),
		[optimisticLayout, isPending, handleLayoutChange, Icon],
	);

	return (
		<>
			<footer className="sticky bottom-0 z-50 mx-auto w-full max-w-lg border border-gray-200 bg-white sm:rounded-3xl dark:border-gray-600 dark:bg-gray-700">
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

export const Footer = memo(FooterComponent);
