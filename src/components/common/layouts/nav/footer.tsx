"use client";
import { DownloadIcon, SearchIcon, UploadIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import {
	memo,
	type ReactNode,
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useState,
	useTransition,
} from "react";
import { UtilButtons } from "@/components/common/layouts/nav/util-buttons";
import { Button } from "@/components/common/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/common/ui/drawer";
import { cn } from "@/components/common/utils/cn";
import { SearchCard } from "../../features/search/search-card";
import type { search } from "../../features/search/search-filter";

const LAYOUTS = {
	dumper: "DUMPER",
	viewer: "VIEWER",
};

const DEFAULT_LAYOUT = "dumper";

type Props = {
	search: typeof search;
};
function FooterComponent({ search }: Props) {
	const [open, setOpen] = useState(false);

	const router = useRouter();
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
				router.replace(`?${params.toString()}`);
			});
		},
		[router, searchParams],
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
				<DrawerTrigger asChild>
					<div className="flex items-center justify-center">
						<Button
							className="bg-linear-to-t from-primary-grad-from to-primary-grad-to shadow-sm"
							size="navCenter"
							type="button"
							variant="navCenter"
						>
							{Icon("", <SearchIcon className="size-6 text-white" />)}
							<span className="sr-only">Action</span>
						</Button>
					</div>
				</DrawerTrigger>
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
		<footer className="sticky bottom-0 z-50 mx-auto w-full max-w-lg border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700 sm:rounded-3xl ">
			<Drawer onOpenChange={setOpen} open={open} snapPoints={[0.5]}>
				{navigationButtons}
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle />
					</DrawerHeader>
					<Suspense
						fallback={<div className="h-32 animate-pulse bg-gray-100" />}
					>
						<UtilButtons
							handleReload={handleReload}
							onSignOutSubmit={onSignOutSubmit}
						/>
						<SearchCard search={search} />
					</Suspense>
				</DrawerContent>
			</Drawer>
		</footer>
	);
}

export const Footer = memo(FooterComponent);
