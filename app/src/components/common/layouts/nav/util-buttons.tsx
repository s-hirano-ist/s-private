"use client";
import { Globe, LogOut, Moon, RefreshCw, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import { Button } from "@/components/common/ui/button";
import { redirect } from "@/infrastructures/i18n/routing";

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
		<div className="grid grid-cols-4 gap-3 px-4 py-2">
			<Button
				className="flex h-16 flex-col items-center gap-1"
				onClick={handleReload}
				variant="outline"
			>
				<RefreshCw className="size-5" />
				<span className="text-xs">{t("reload")}</span>
				<span className="sr-only">{t("reload")}</span>
			</Button>
			<Button
				className="flex h-16 flex-col items-center gap-1"
				onClick={handleTheme}
				variant="outline"
			>
				{theme === "light" ? (
					<Moon className="size-5" />
				) : (
					<Sun className="size-5" />
				)}
				<span className="text-xs">{theme === "light" ? "DARK" : "LIGHT"}</span>
				<span className="sr-only">appearance</span>
			</Button>
			<Button
				className="flex h-16 flex-col items-center gap-1"
				onClick={handleLanguage}
				variant="outline"
			>
				<Globe className="size-5" />
				<span className="text-xs">{locale === "en" ? "JA" : "EN"}</span>
				<span className="sr-only">language</span>
			</Button>
			{shouldShowSignOut && (
				<Button
					className="flex h-16 flex-col items-center gap-1"
					data-testid="log-out-button"
					onClick={onSignOutSubmit}
					variant="outline"
				>
					<LogOut className="size-5" />
					<span className="text-xs">{t("signOut")}</span>
					<span className="sr-only">{t("signOut")}</span>
				</Button>
			)}
		</div>
	);
}
