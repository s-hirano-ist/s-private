import type { Route } from "next";
import "./globals.css";
import { NotFound } from "@/components/common/display/status/not-found";
import { routing } from "@/infrastructures/i18n/routing-config";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Noto_Sans_JP } from "next/font/google";
import { cookies, headers } from "next/headers";
import { Suspense } from "react";

const notoSansJp = Noto_Sans_JP({ subsets: ["latin"], display: "swap" });
const defaultNotFoundLabels = {
	returnHome: "ホームに戻る",
	title: "コンテンツが見つかりません",
} as const;

async function getPreferredLocale() {
	const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
	const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;

	if (cookieLocale && hasLocale(routing.locales, cookieLocale)) {
		return cookieLocale;
	}

	const preferredLocale = headerStore
		.get("accept-language")
		?.split(",")[0]
		.split("-")[0];

	if (preferredLocale && hasLocale(routing.locales, preferredLocale)) {
		return preferredLocale;
	}

	return routing.defaultLocale;
}

async function PreferredLocaleNotFound() {
	const localeValue = await getPreferredLocale();
	const [label, statusCode] = await Promise.all([
		getTranslations({ locale: localeValue, namespace: "label" }),
		getTranslations({ locale: localeValue, namespace: "statusCode" }),
	]);

	return (
		<main className="min-h-screen" lang={localeValue}>
			<NotFound
				returnHomeHref={`/${localeValue}`}
				returnHomeText={label("returnHome")}
				title={statusCode("404")}
			/>
		</main>
	);
}

function GlobalNotFoundFallback() {
	return (
		<main className="min-h-screen" lang={routing.defaultLocale}>
			<NotFound
				returnHomeHref={`/${routing.defaultLocale}`}
				returnHomeText={defaultNotFoundLabels.returnHome}
				title={defaultNotFoundLabels.title}
			/>
		</main>
	);
}

export default function GlobalNotFound() {
	return (
		<html lang={routing.defaultLocale}>
			<body className={notoSansJp.className}>
				<Suspense fallback={<GlobalNotFoundFallback />}>
					<PreferredLocaleNotFound />
				</Suspense>
			</body>
		</html>
	);
}
