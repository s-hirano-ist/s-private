"use client";
import { BotIcon, FileUpIcon, SearchIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { type ReactNode, Suspense, useEffect, useState } from "react";
import { cn } from "@/common/tailwind/utils";
import { UtilButtons } from "@/components/common/nav/util-buttons";
import { Button } from "@/components/common/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/common/ui/drawer";

const LAYOUTS = {
	dumper: "DUMPER",
	viewer: "VIEWER",
};

const DEFAULT_LAYOUT = "dump";

export function Footer() {
	const [open, setOpen] = useState(false);
	const pathname = usePathname();
	const t = useTranslations("utils");

	function Icon(name: string, icon: ReactNode) {
		return (
			<div className="flex flex-col items-center">
				{icon}
				<div className="text-xs font-thin">{name}</div>
			</div>
		);
	}
	const handleReload = () => {
		window.location.reload();
	};

	async function onSignOutSubmit() {
		await signOut();
	}

	const router = useRouter();
	const searchParams = useSearchParams();

	const [layout, setLayout] = useState(
		searchParams.get("layout") ?? DEFAULT_LAYOUT,
	);

	const handleLayoutChange = (value: string) => {
		setLayout(value);
		const params = new URLSearchParams(searchParams);
		params.delete("page");
		params.set("layout", value);
		router.replace(`?${params.toString()}`);
	};

	useEffect(() => {
		const layout = searchParams.get("layout");
		if (!layout) return;

		const params = new URLSearchParams(searchParams);
		if (!Object.keys(LAYOUTS).includes(layout)) {
			params.delete("layout");
			router.replace(`?${params.toString()}`);
			setLayout(DEFAULT_LAYOUT);
		}
	}, [searchParams, router]);

	return (
		<footer className="sticky bottom-0 z-50 mx-auto w-full max-w-lg border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700 sm:rounded-3xl ">
			<Drawer onOpenChange={setOpen} open={open} snapPoints={[0.5]}>
				<div className="mx-auto grid h-16 max-w-lg grid-cols-3 bg-linear-to-r from-primary-grad-from to-primary-grad-to text-white sm:rounded-3xl">
					<Button
						asChild
						className={cn(
							"sm:rounded-s-3xl",
							/^\/(?:ja|en)(?:\/)?$/.test(pathname) ? "bg-black/10" : "",
						)}
						onClick={() => handleLayoutChange("dumper")}
						size="navSide"
						variant="navSide"
					>
						{Icon("DUMPER", <FileUpIcon className="size-6" />)}
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
						className={
							/^\/(?:ja|en)\/(viewer|books|contents)/.test(pathname)
								? "bg-black/10"
								: ""
						}
						onClick={() => handleLayoutChange("viewer")}
						size="navSide"
						variant="navSide"
					>
						{Icon("VIEWER", <BotIcon className="size-6" />)}
					</Button>
				</div>
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
					</Suspense>
				</DrawerContent>
			</Drawer>
		</footer>
	);
}
