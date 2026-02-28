"use client";
import { Button } from "@s-hirano-ist/s-ui/ui/button";
import { cn } from "@s-hirano-ist/s-ui/utils/cn";
import { DownloadIcon, SearchIcon, UploadIcon } from "lucide-react";
import type { Route } from "next";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import {
	type ReactNode,
	useEffect,
	useOptimistic,
	useState,
	useTransition,
} from "react";
import type { searchContentFromClient } from "@/application-services/search/search-content-from-client";

const SearchDrawer = dynamic(
	() => import("./search-drawer").then((mod) => mod.SearchDrawer),
	{ ssr: false },
);

type Props = {
	search: typeof searchContentFromClient;
};
export function Footer({ search }: Props) {
	const [open, setOpen] = useState(false);

	const router = useRouter();
	const pathname = usePathname();
	const [isPending, startTransition] = useTransition();

	const layout = pathname.endsWith("/viewer") ? "viewer" : "dumper";

	const [optimisticLayout, setOptimisticLayout] = useOptimistic(layout);

	useEffect(() => {
		if (pathname.endsWith("/viewer")) {
			router.prefetch(pathname.replace(/\/viewer$/, "") as Route);
		} else {
			router.prefetch(`${pathname}/viewer` as Route);
		}
	}, [router, pathname]);

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
							? "font-medium text-foreground"
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

			if (pathname.includes("/book/") || pathname.includes("/note/")) {
				const localeMatch = pathname.match(/^\/([^/]+)/);
				const locale = localeMatch ? localeMatch[1] : "";
				const target =
					value === "viewer"
						? `/${locale}/articles/viewer`
						: `/${locale}/articles`;
				router.replace(target as Route);
			} else if (value === "viewer") {
				router.replace(`${pathname.replace(/\/viewer$/, "")}/viewer` as Route);
			} else {
				router.replace(pathname.replace(/\/viewer$/, "") as Route);
			}
		});
	};

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
					data-testid="search-button"
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
			{open && (
				<SearchDrawer onOpenChange={setOpen} open={open} search={search} />
			)}
		</>
	);
}
