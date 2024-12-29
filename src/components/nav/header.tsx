"use client";
import AnimatedGradientText from "@/components/animata/animated-gradient-text";
import { Button } from "@/components/ui/button";
import { DEFAULT_SIGN_OUT_REDIRECT } from "@/constants";
import { signOut } from "@/features/auth/actions/sign-out";
import { useToast } from "@/hooks/use-toast";
import { LogOutIcon } from "lucide-react";
import { useTransitionRouter } from "next-view-transitions";
// import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { usePathname } from "next/navigation";

type Props = {
	title: string;
};

export function Header({ title }: Props) {
	const pathname = usePathname();
	const { toast } = useToast();
	const router = useTransitionRouter();

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
		<header className="sticky top-0 z-50 w-full bg-primary py-2 text-white">
			<div className="flex items-center justify-between sm:px-2">
				<div className="flex items-center justify-start">
					<AnimatedGradientText className="px-4 py-1 text-xl font-semibold">
						{title}
					</AnimatedGradientText>
				</div>
				{/* TODO: add theme button */}
				<nav>
					{pathname !== "/auth" && (
						<Button
							variant="ghost"
							onClick={onSignOutSubmit}
							data-testid="log-out-button"
						>
							<LogOutIcon className="size-6" />
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
