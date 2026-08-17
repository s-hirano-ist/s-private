import type { Messages } from "next-intl";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";
import { routing } from "./routing-config";

export default getRequestConfig(async ({ locale }) => {
	const resolvedLocale = locale ?? (await rootLocale());

	// Ensure that a valid locale is used
	if (!resolvedLocale || !hasLocale(routing.locales, resolvedLocale)) {
		notFound();
	}

	return {
		locale: resolvedLocale,
		messages: (
			(await import(`../../../messages/${resolvedLocale}.json`)) as {
				default: Messages;
			}
		).default,
	};
});
