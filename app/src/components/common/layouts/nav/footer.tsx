"use client";
import type { searchContentFromClient } from "@/application-services/search/search-content-from-client";
import type { Route } from "next";
import { Button } from "@s-hirano-ist/s-ui/button";
import { cn } from "@s-hirano-ist/s-ui/utils/cn";
import { haptic } from "@s-hirano-ist/s-ui/utils/haptic";
import { DownloadIcon, SearchIcon, UploadIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
	type ReactNode,
	useEffect,
	useOptimistic,
	useState,
	useTransition,
} from "react";
import { SearchDrawer } from "./search-drawer";

type Props = {
	search: typeof searchContentFromClient;
};

// oxlint-disable-next-line typescript/no-unnecessary-type-assertion -- Next typed router methods require Route even for runtime pathname-derived values.
const toRoute = (path: string): Route => path as Route;

type NavIconProps = {
	icon: ReactNode;
	isActive: boolean;
	name: string;
};

function NavIcon({ icon, isActive, name }: NavIconProps) {
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

export function Footer({ search }: Props) {
	const [open, setOpen] = useState(false);

	const router = useRouter();
	const pathname = usePathname();
	const [isPending, startTransition] = useTransition();

	const layout = pathname.endsWith("/viewer") ? "viewer" : "dumper";

	const [optimisticLayout, setOptimisticLayout] = useOptimistic(layout);

	useEffect(() => {
		if (pathname.endsWith("/viewer")) {
			router.prefetch(toRoute(pathname.replace(/\/viewer$/u, "")));
		} else {
			router.prefetch(toRoute(`${pathname}/viewer`));
		}
	}, [router, pathname]);

	const handleLayoutChange = (value: string) => {
		haptic();
		startTransition(() => {
			setOptimisticLayout(value);

			if (pathname.includes("/book/") || pathname.includes("/note/")) {
				const localeMatch = /^\/([^/]+)/u.exec(pathname);
				const locale = localeMatch ? localeMatch[1] : "";
				const target =
					value === "viewer"
						? `/${locale}/articles/viewer`
						: `/${locale}/articles`;
				router.replace(toRoute(target));
			} else if (value === "viewer") {
				router.replace(toRoute(`${pathname.replace(/\/viewer$/u, "")}/viewer`));
			} else {
				router.replace(toRoute(pathname.replace(/\/viewer$/u, "")));
			}
		});
	};

	const isDumperActive = optimisticLayout === "dumper";
	const isViewerActive = optimisticLayout === "viewer";

	const navigationButtons = (
		<div className="mx-auto grid h-14 max-w-lg grid-cols-3 items-center rounded-full text-foreground">
			<Button
				className={cn(
					"size-full rounded-full transition-all duration-200 hover:bg-primary/10",
					isDumperActive && "bg-primary/15",
					isPending && !isDumperActive && "opacity-50",
				)}
				disabled={isPending}
				onClick={() => handleLayoutChange("dumper")}
				size="icon"
				variant="ghost"
			>
				<NavIcon
					icon={<UploadIcon className="size-5" />}
					isActive={isDumperActive}
					name="DUMPER"
				/>
			</Button>
			<div className="flex items-center justify-center">
				<Button
					className="-mt-5 size-14 rounded-full bg-linear-to-br from-primary to-primary-grad text-white shadow-[0_4px_20px_rgb(var(--sui-primary)/0.4)] ring-4 ring-background transition-all duration-200 hover:scale-110 hover:shadow-[0_6px_28px_rgb(var(--sui-primary)/0.5)] active:scale-95"
					data-testid="search-button"
					onClick={() => {
						haptic();
						setOpen(true);
					}}
					size="icon"
					type="button"
					variant="default"
				>
					<SearchIcon className="size-5 text-white" />
					<span className="sr-only">Action</span>
				</Button>
			</div>
			<Button
				className={cn(
					"size-full rounded-full transition-all duration-200 hover:bg-primary/10",
					isViewerActive && "bg-primary/15",
					isPending && !isViewerActive && "opacity-50",
				)}
				disabled={isPending}
				onClick={() => handleLayoutChange("viewer")}
				size="icon"
				variant="ghost"
			>
				<NavIcon
					icon={<DownloadIcon className="size-5" />}
					isActive={isViewerActive}
					name="VIEWER"
				/>
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
