import type { Route } from "next";
import { NotFound } from "@/components/common/display/status/not-found";
import { getTranslations } from "next-intl/server";
import { locale } from "next/root-params";

export default async function LocalizedNotFound() {
	const localeValue = await locale();
	const [label, statusCode] = await Promise.all([
		getTranslations({ locale: localeValue, namespace: "label" }),
		getTranslations({ locale: localeValue, namespace: "statusCode" }),
	]);

	return (
		<NotFound
			returnHomeHref={`/${localeValue}` as Route}
			returnHomeText={label("returnHome")}
			title={statusCode("404")}
		/>
	);
}
