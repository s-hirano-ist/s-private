"use client";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { DEFAULT_SIGN_OUT_REDIRECT } from "@/constants";
import { signOut } from "@/features/auth/actions/sign-out";
import { UtilButtons } from "@/features/dump/components/util-buttons";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/utils/tailwindcss";
import {
	BotIcon,
	FileUpIcon,
	NotebookIcon,
	SearchIcon,
	SendIcon,
} from "lucide-react";
import type { Route } from "next";
import { Link, useTransitionRouter } from "next-view-transitions";
import { redirect, usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";

export function Footer() {
	const [open, setOpen] = useState(false);
	const pathname = usePathname();
	const { toast } = useToast();
	const router = useTransitionRouter();

	const Icon = (name: string, icon: ReactNode) => {
		return (
			<div className="flex flex-col items-center">
				{icon}
				<div className="text-xs font-thin">{name}</div>
			</div>
		);
	};
	const handleReload = () => {
		window.location.reload();
	};

	async function onSignOutSubmit() {
		// TODO: Auth.jsのsignoutをここで呼び出すとテストがしづらい
		redirect("api/auth/signout");
		// const response = await signOut();
		// if (response.success) {
		// 	router.push(DEFAULT_SIGN_OUT_REDIRECT);
		// } else {
		// 	toast({
		// 		variant: "destructive",
		// 		description: response.message,
		// 	});
		// }
	}

	return (
		<footer className="sticky bottom-0 z-50 mx-auto w-full max-w-lg border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700 sm:rounded-3xl ">
			<Drawer open={open} onOpenChange={setOpen} snapPoints={[0.5]}>
				<div className="mx-auto grid h-16 max-w-lg grid-cols-5 bg-gradient-to-r from-primary-grad-from to-primary-grad-to text-white sm:rounded-3xl">
					{/* FIXME: bug with parallel routes
					 * https://nextjs.org/docs/app/building-your-application/routing/parallel-routes */}
					<Button
						variant="navSide"
						size="navSide"
						className={cn(
							"sm:rounded-s-3xl",
							pathname === "/" ? "bg-black/10" : "",
						)}
						asChild
					>
						<Link href={"/" as Route}>
							{Icon("DUMPER", <FileUpIcon className="size-6" />)}
						</Link>
					</Button>

					{/* FIXME: bug with parallel routes
					 * https://nextjs.org/docs/app/building-your-application/routing/parallel-routes */}
					<Button
						variant="navSide"
						size="navSide"
						type="button"
						className={pathname === "/viewer" ? "bg-black/10" : ""}
						asChild
					>
						<Link href={"/viewer" as Route}>
							{Icon("VIEWER", <NotebookIcon className="size-6" />)}
						</Link>
					</Button>

					<DrawerTrigger asChild>
						<div className="flex items-center justify-center">
							<Button
								variant="navCenter"
								size="navCenter"
								type="button"
								className="bg-gradient-to-t from-primary-grad-from to-primary-grad-to shadow"
							>
								{Icon("", <SendIcon className="size-6 text-white" />)}
								<span className="sr-only">Action</span>
							</Button>
						</div>
					</DrawerTrigger>

					{/* FIXME: bug with parallel routes
					 * https://nextjs.org/docs/app/building-your-application/routing/parallel-routes */}
					<Button
						variant="navSide"
						size="navSide"
						type="button"
						className={pathname === "/search" ? "bg-black/10" : ""}
						asChild
					>
						<Link href={"/search" as Route}>
							{Icon("SEARCH", <SearchIcon className="size-6" />)}
						</Link>
					</Button>

					{/* FIXME: bug with parallel routes
					 * https://nextjs.org/docs/app/building-your-application/routing/parallel-routes */}
					<Button
						variant="navSide"
						size="navSide"
						className={cn(
							"sm:rounded-e-3xl",
							pathname === "/ai" ? "bg-black/10" : "",
						)}
						asChild
					>
						<Link href={"/ai" as Route}>
							{Icon("AI", <BotIcon className="size-6" />)}
						</Link>
					</Button>
				</div>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>便利ツール集</DrawerTitle>
						<DrawerDescription>
							リンクをクリックしてください。
						</DrawerDescription>
					</DrawerHeader>
					<UtilButtons
						handleReload={handleReload}
						onSignOutSubmit={onSignOutSubmit}
					/>
				</DrawerContent>
			</Drawer>
		</footer>
	);
}
