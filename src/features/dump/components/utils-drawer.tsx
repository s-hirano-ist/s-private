"use client";
import { Button } from "@/components/ui/button";
import {
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { DEFAULT_SIGN_OUT_REDIRECT, UTIL_URLS } from "@/constants";
import { signOut } from "@/features/auth/actions/sign-out";
import { useToast } from "@/hooks/use-toast";
import { Link, useTransitionRouter } from "next-view-transitions";
import { usePathname } from "next/navigation";

export function UtilsDrawer() {
	const pathname = usePathname();
	const { toast } = useToast();
	const router = useTransitionRouter();

	const handleReload = () => {
		window.location.reload();
	};

	async function onSignOutSubmit() {
		const response = await signOut();
		if (response.success) {
			router.push(DEFAULT_SIGN_OUT_REDIRECT);
		} else {
			toast({
				variant: "destructive",
				description: response.message,
			});
		}
	}

	return (
		<>
			<DrawerHeader>
				<DrawerTitle>便利ツール集</DrawerTitle>
				<DrawerDescription>リンクをクリックしてください。</DrawerDescription>
			</DrawerHeader>
			<div className="grid grid-cols-2 gap-2 px-2">
				{UTIL_URLS.map((url) => {
					return (
						<Link href={url.url} key={url.name}>
							<Button className="w-full">{url.name}</Button>
						</Link>
					);
				})}
				<Button className="col-span-2" onClick={handleReload}>
					RELOAD PAGE
				</Button>
				{pathname !== "/auth" && (
					<Button
						onClick={onSignOutSubmit}
						data-testid="log-out-button"
						className="col-span-2"
					>
						サインアウト
					</Button>
				)}
			</div>
			{/* // TODO: add theme button
			<Button
				variant="ghost"
				onClick={() => setTheme("light")}
				className="block dark:hidden"
			>
				<MoonIcon className="size-8" />
				<span className="sr-only">light theme button</span>
			</Button>
			<Button
				variant="ghost"
				onClick={() => setTheme("dark")}
				className="hidden dark:block"
			>
				<SunIcon className="size-8" />
				<span className="sr-only">dark theme button</span>
			</Button> */}
		</>
	);
}
