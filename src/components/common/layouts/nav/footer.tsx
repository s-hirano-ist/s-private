"use client";
import { DownloadIcon, SearchIcon, UploadIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import {
	memo,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useState,
	useTransition,
} from "react";
import type { searchContentFromClient } from "@/application-services/search/search-content-from-client";
import { Button } from "@/components/common/ui/button";
import { Command } from "@/components/common/ui/command";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from "@/components/common/ui/drawer";
import { cn } from "@/components/common/utils/cn";
import { SearchCard } from "../../features/search/search-card";
import { UtilButtons } from "./util-buttons";

const LAYOUTS = {
	dumper: "DUMPER",
	viewer: "VIEWER",
};

const DEFAULT_LAYOUT = "dumper";

type Props = {
	search: typeof searchContentFromClient;
};
function FooterComponent({ search }: Props) {
	const [open, setOpen] = useState(false);

	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const [layout, setLayout] = useState(
		searchParams.get("layout") ?? DEFAULT_LAYOUT,
	);
	const [isPending, startTransition] = useTransition();

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
				<div className="text-xs font-thin">{name}</div>
			</div>
		);
	}, []);

	const handleReload = useCallback(() => {
		window.location.reload();
	}, []);

	const onSignOutSubmit = useCallback(async () => {
		await signOut();
	}, []);

	const handleLayoutChange = useCallback(
		(value: string) => {
			// Optimistic UI update
			setLayout(value);

			startTransition(() => {
				const params = new URLSearchParams(searchParams);
				params.delete("page");
				params.set("layout", value);

				// If we're on a book or note detail page, navigate back to root
				if (pathname.includes("/book/") || pathname.includes("/note/")) {
					// Extract locale from pathname (e.g., /en/book/... or /ja/note/...)
					const localeMatch = pathname.match(/^\/([^/]+)/);
					const locale = localeMatch ? localeMatch[1] : "";
					router.replace(`/${locale}?${params.toString()}`);
				} else {
					router.replace(`?${params.toString()}`);
				}
			});
		},
		[router, searchParams, pathname],
	);

	useEffect(() => {
		const currentLayout = searchParams.get("layout");
		if (!currentLayout) return;

		if (!Object.keys(LAYOUTS).includes(currentLayout)) {
			const params = new URLSearchParams(searchParams);
			params.delete("layout");
			router.replace(`?${params.toString()}`);
			setLayout(DEFAULT_LAYOUT);
		} else if (currentLayout !== layout) {
			setLayout(currentLayout);
		}
	}, [searchParams, router, layout]);

	const navigationButtons = useMemo(
		() => (
			<div className="mx-auto grid h-16 max-w-lg grid-cols-3 bg-linear-to-r from-primary-grad-from to-primary-grad-to text-white sm:rounded-3xl">
				<Button
					asChild
					className={cn(
						"sm:rounded-s-3xl",
						layout === "dumper" ? "bg-black/10" : "",
						isPending && layout !== "dumper" ? "opacity-50" : "",
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
						className="bg-linear-to-t from-primary-grad-from to-primary-grad-to shadow-sm"
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
						layout === "viewer" ? "bg-black/10" : "",
						isPending && layout !== "viewer" ? "opacity-50" : "",
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
		[layout, isPending, handleLayoutChange, Icon],
	);

	return (
		<>
			<footer className="sticky bottom-0 z-50 mx-auto w-full max-w-lg border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700 sm:rounded-3xl ">
				{navigationButtons}
			</footer>
			<Drawer onOpenChange={setOpen} open={open}>
				<DrawerContent className="max-h-[80vh]">
					<DrawerHeader className="sr-only">
						<DrawerTitle>Command Palette</DrawerTitle>
					</DrawerHeader>
					<Command className="[&_[cmdk-group-heading]]:text-muted-foreground **:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
						<UtilButtons
							handleReload={handleReload}
							onSignOutSubmit={onSignOutSubmit}
						/>
						<SearchCard search={search} />
					</Command>
				</DrawerContent>
			</Drawer>
		</>
	);
}

export const Footer = memo(FooterComponent);
