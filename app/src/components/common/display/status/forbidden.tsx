"use client";
import { StatusCodeView } from "@s-hirano-ist/s-ui/display/status/status-code-view";
import { Button } from "@s-hirano-ist/s-ui/ui/button";
import { useTranslations } from "next-intl";

export function Forbidden() {
	const t = useTranslations("label");

	return (
		<div className="flex flex-col items-center gap-6 py-8">
			<StatusCodeView statusCode="403" statusCodeString={t("403")} />
			<form action="/api/auth/signout" method="post">
				<Button type="submit" variant="outline">
					{t("resignIn")}
				</Button>
			</form>
		</div>
	);
}
