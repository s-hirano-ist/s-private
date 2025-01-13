"use client";
import { Button } from "@/components/ui/button";
import { UTIL_URLS } from "@/constants";
import { Link } from "next-view-transitions";
import { usePathname } from "next/navigation";

type Props = { handleReload: () => void; onSignOutSubmit: () => Promise<void> };

export function UtilButtons({ handleReload, onSignOutSubmit }: Props) {
	const pathname = usePathname();
	return (
		<>
			<div className="grid grid-cols-2 gap-2 px-2">
				{UTIL_URLS.map((url) => {
					return (
						<Button className="w-full" asChild key={url.name}>
							<Link href={url.url}>{url.name}</Link>
						</Button>
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
