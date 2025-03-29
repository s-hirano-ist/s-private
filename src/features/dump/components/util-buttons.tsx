"use client";
import { Button } from "@/components/ui/button";
import { UTIL_URLS } from "@/constants";
import { redirect } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Link } from "next-view-transitions";
import { usePathname } from "next/navigation";

type Props = { handleReload: () => void; onSignOutSubmit: () => Promise<void> };

const removeLangPrefix = (pathname: string): string => {
	return pathname.replace(/^\/(en|ja)(\/|$)/, "/");
};

export function UtilButtons({ handleReload, onSignOutSubmit }: Props) {
	const pathname = usePathname();
	const { setTheme, theme } = useTheme();

	const handleTheme = () => {
		if (theme === "light") setTheme("dark");
		else setTheme("light");
	};

	const locale = useLocale();

	const handleLanguage = () => {
		redirect({
			href: removeLangPrefix(pathname),
			locale: locale === "en" ? "ja" : "en",
		});
	};

	const t = useTranslations("utils");

	return (
		<div className="grid grid-cols-2 gap-2 px-2 sm:grid-cols-4">
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
			{pathname !== "/auth" && (
				<Button data-testid="log-out-button" onClick={onSignOutSubmit}>
					{t("signOut")}
				</Button>
			)}
		</div>
	);
}
