"use client";
import { Button } from "@/components/ui/button";
import { UTIL_URLS } from "@/constants";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Link } from "next-view-transitions";
import { usePathname } from "next/navigation";

type Props = { handleReload: () => void; onSignOutSubmit: () => Promise<void> };

export function UtilButtons({ handleReload, onSignOutSubmit }: Props) {
	const pathname = usePathname();
	const { setTheme, theme } = useTheme();

	const handleTheme = () => {
		if (theme === "light") setTheme("dark");
		else setTheme("light");
	};

	const t = useTranslations();

	console.log("t", t);

	return (
		<>
			<div className="grid grid-cols-2 gap-2 px-2 sm:grid-cols-4">
				{UTIL_URLS.map((url) => {
					return (
						<Button className="w-full" asChild key={url.name}>
							<Link href={url.url}>{url.name}</Link>
						</Button>
					);
				})}
				<Button onClick={handleReload}>RELOAD PAGE</Button>
				<Button onClick={handleTheme}>TOGGLE DARK MODE</Button>
				<Button onClick={handleReload}>TOGGLE LANGUAGE</Button>
				{pathname !== "/auth" && (
					<Button onClick={onSignOutSubmit} data-testid="log-out-button">
						SIGN OUT
					</Button>
				)}
			</div>
		</>
	);
}
