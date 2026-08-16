import type { Route } from "next";
import "./globals.css";
import { NotFound } from "@/components/common/display/status/not-found";
import { routing } from "@/infrastructures/i18n/routing-config";
import { getTranslations } from "next-intl/server";
import { Noto_Sans_JP } from "next/font/google";
import { cookies, headers } from "next/headers";

const notoSansJp = Noto_Sans_JP({ subsets: ["latin"], display: "swap" });

async function getPreferredLocale() {
	const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
	const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;

	if (
		cookieLocale &&
		(routing.locales as readonly string[]).includes(cookieLocale)
	) {
		return cookieLocale;
	}

	const preferredLocale = headerStore
		.get("accept-language")
		?.split(",")[0]
		.split("-")[0];

	if (
		preferredLocale &&
		(routing.locales as readonly string[]).includes(preferredLocale)
	) {
		return preferredLocale;
	}

	return routing.defaultLocale;
}

export default async function GlobalNotFound() {
	const localeValue = await getPreferredLocale();
	const [label, statusCode] = await Promise.all([
		getTranslations({ locale: localeValue, namespace: "label" }),
		getTranslations({ locale: localeValue, namespace: "statusCode" }),
	]);

	return (
		<html lang={localeValue}>
			<body className={notoSansJp.className}>
				<main className="min-h-screen">
					<NotFound
						returnHomeHref={`/${localeValue}` as Route}
						returnHomeText={label("returnHome")}
						title={statusCode("404")}
					/>
				</main>
			</body>
		</html>
	);
}
