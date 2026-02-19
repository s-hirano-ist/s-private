import Loading from "@s-hirano-ist/s-ui/display/loading";
import { cookies, headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { NotFound } from "@/components/common/display/status/not-found";
import { routing } from "@/infrastructures/i18n/routing";

async function getLocale() {
	// Try to get locale from cookie first
	const cookieStore = await cookies();
	const localeCookie = cookieStore.get("NEXT_LOCALE");

	if (
		localeCookie &&
		(routing.locales as readonly string[]).includes(localeCookie.value)
	) {
		return localeCookie.value as "en" | "ja";
	}

	// Fallback to Accept-Language header
	const headersList = await headers();
	const acceptLanguage = headersList.get("accept-language");

	if (acceptLanguage) {
		const preferredLocale = acceptLanguage.split(",")[0].split("-")[0];

		if ((routing.locales as readonly string[]).includes(preferredLocale)) {
			return preferredLocale as "en" | "ja";
		}
	}

	// Default to Japanese
	return routing.defaultLocale as "en" | "ja";
}

async function NotFoundContent() {
	const locale = await getLocale();
	const label = await getTranslations({ locale, namespace: "label" });
	const statusCode = await getTranslations({ locale, namespace: "statusCode" });

	return (
		<NotFound returnHomeText={label("returnHome")} title={statusCode("404")} />
	);
}

export default function Page() {
	return (
		<Suspense fallback={<Loading />}>
			<NotFoundContent />
		</Suspense>
	);
}
