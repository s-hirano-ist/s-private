"use client";
import { StatusCodeView } from "@s-hirano-ist/s-ui/display/status/status-code-view";
import { Button } from "@s-hirano-ist/s-ui/ui/button";
import { useTranslations } from "next-intl";

export function Forbidden() {
	const t = useTranslations("label");

	return (
		<div className="space-y-2">
			<StatusCodeView statusCode="403" statusCodeString={t("403")} />
			<form action="/api/auth/signout" className="flex flex-col" method="post">
				<Button className="mx-auto" type="submit">
					{t("resignIn")}
				</Button>
			</form>
		</div>
	);
}
