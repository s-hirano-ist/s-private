"use client";
import {
	BotIcon,
	FileUpIcon,
	NotebookIcon,
	SearchIcon,
	SendIcon,
} from "lucide-react";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { type ReactNode, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { UtilButtons } from "@/features/dump/components/util-buttons";
import { Link } from "@/i18n/routing";
import { cn } from "@/utils/tailwindcss";

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

	return (
		<footer className="sticky bottom-0 z-50 mx-auto w-full max-w-lg border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700 sm:rounded-3xl ">
			<Drawer onOpenChange={setOpen} open={open} snapPoints={[0.5]}>
				<div className="mx-auto grid h-16 max-w-lg grid-cols-5 bg-linear-to-r from-primary-grad-from to-primary-grad-to text-white sm:rounded-3xl">
					{/* FIXME: bug with parallel routes
					 * https://nextjs.org/docs/app/building-your-application/routing/parallel-routes */}
					<Button
						asChild
						className={cn(
							"sm:rounded-s-3xl",
							/^\/(?:ja|en)(?:\/)?$/.test(pathname) ? "bg-black/10" : "",
						)}
						size="navSide"
						variant="navSide"
					>
						<Link href={"/" as Route}>
							{Icon("DUMPER", <FileUpIcon className="size-6" />)}
						</Link>
					</Button>

					{/* FIXME: bug with parallel routes
					 * https://nextjs.org/docs/app/building-your-application/routing/parallel-routes */}
					<Button
						asChild
						className={
							/^\/(?:ja|en)\/(viewer|books|contents)/.test(pathname)
								? "bg-black/10"
								: ""
						}
						size="navSide"
						type="button"
						variant="navSide"
					>
						<Link href={"/viewer" as Route}>
							{Icon("VIEWER", <NotebookIcon className="size-6" />)}
						</Link>
					</Button>

					<DrawerTrigger asChild>
						<div className="flex items-center justify-center">
							<Button
								className="bg-linear-to-t from-primary-grad-from to-primary-grad-to shadow-sm"
								size="navCenter"
								type="button"
								variant="navCenter"
							>
								{Icon("", <SendIcon className="size-6 text-white" />)}
								<span className="sr-only">Action</span>
							</Button>
						</div>
					</DrawerTrigger>

					{/* FIXME: bug with parallel routes
					 * https://nextjs.org/docs/app/building-your-application/routing/parallel-routes */}
					<Button
						asChild
						className={
							/^\/(?:ja|en)\/(search)/.test(pathname) ? "bg-black/10" : ""
						}
						size="navSide"
						type="button"
						variant="navSide"
					>
						<Link href={"/search" as Route}>
							{Icon("SEARCH", <SearchIcon className="size-6" />)}
						</Link>
					</Button>

					{/* FIXME: bug with parallel routes
					 * https://nextjs.org/docs/app/building-your-application/routing/parallel-routes */}
					<Button
						asChild
						className={cn(
							"sm:rounded-e-3xl",
							/^\/(?:ja|en)\/(ai)/.test(pathname) ? "bg-black/10" : "",
						)}
						size="navSide"
						variant="navSide"
					>
						<Link href={"/ai" as Route}>
							{Icon("AI", <BotIcon className="size-6" />)}
						</Link>
					</Button>
				</div>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>{t("utilsTitle")}</DrawerTitle>
						<DrawerDescription>{t("utilsDescription")}</DrawerDescription>
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
