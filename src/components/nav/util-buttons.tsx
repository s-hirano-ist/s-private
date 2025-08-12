"use client";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { UTIL_URLS } from "@/constants";
import { Link, redirect } from "@/i18n/routing";

type Props = { handleReload: () => void; onSignOutSubmit: () => Promise<void> };

const removeLangPrefix = (pathname: string): string => {
	return pathname.replace(/^\/(en|ja)(\/|$)/, "/");
};

export function UtilButtons({ handleReload, onSignOutSubmit }: Props) {
	const pathname = usePathname();
	const { setTheme, theme } = useTheme();
	const locale = useLocale();
	const t = useTranslations("utils");

	const handleTheme = useMemo(
		() => () => {
			if (theme === "light") setTheme("dark");
			else setTheme("light");
		},
		[theme, setTheme],
	);

	const handleLanguage = useMemo(
		() => () => {
			redirect({
				href: removeLangPrefix(pathname),
				locale: locale === "en" ? "ja" : "en",
			});
		},
		[pathname, locale],
	);

	const shouldShowSignOut = useMemo(() => pathname !== "/auth", [pathname]);

	return (
		<div className="grid gap-2 px-2 grid-cols-1 sm:grid-cols-3">
			{UTIL_URLS.map((url) => {
				return (
					<Button asChild className="w-full" key={url.name}>
						<Link href={url.url}>{url.name}</Link>
					</Button>
				);
			})}
			<Button onClick={handleReload}>{t("reload")}</Button>
			<Button onClick={handleTheme}>{t("appearance")}</Button>
			<Button onClick={handleLanguage}>{t("language")}</Button>
			{shouldShowSignOut && (
				<Button data-testid="log-out-button" onClick={onSignOutSubmit}>
					{t("signOut")}
				</Button>
			)}
		</div>
	);
}
