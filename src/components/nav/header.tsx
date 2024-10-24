"use client";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions/sign-out";
import { useToast } from "@/hooks/use-toast";
import { Link } from "next-view-transitions";
// import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import { usePathname } from "next/navigation";

type Props = {
	title: string;
	url?: string;
};

export function Header({ title, url }: Props) {
	const pathname = usePathname();
	const { toast } = useToast();

	async function onSignOutSubmit() {
		const response = await signOut();
		if (response.success) {
			// FIXME: need refresh due to sign-out non-refresh bug?
			// https://github.com/nextauthjs/next-auth/issues/11125
			window.location.reload();
		} else {
			toast({
				variant: "destructive",
				description: response.message,
			});
		}
	}

	return (
		<header className="sticky top-0 z-50 w-full bg-gradient-to-b from-primary to-primary-grad p-2 text-white">
			<div className="flex items-center justify-between px-2">
				<div className="flex items-center justify-start">
					{/* FIXME: scroll behavior causes warning: https://zenn.dev/tk_c/articles/5205f44777903b */}
					<Image
						src="/apple-icon.png"
						width={50}
						height={50}
						alt=""
						className="size-8 object-cover"
					/>
					{url ? (
						<Link href={new URL(url)} target="_blank" scroll={false}>
							<Button variant="link" className="text-xl font-semibold">
								{title}
							</Button>
						</Link>
					) : (
						<p className="px-4 py-1 text-xl font-semibold">{title}</p>
					)}
				</div>
				{/* TODO: add theme button */}
				<nav>
					{pathname !== "/auth" && (
						<Button variant="ghost" onClick={onSignOutSubmit}>
							サインアウト
						</Button>
					)}
					{/* <Button
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
				</nav>
			</div>
		</header>
	);
}
