"use client";
import { useTranslations } from "next-intl";
import { StatusCodeView } from "s-private-components/display/status/status-code-view";
import { Button } from "s-private-components/ui/button";

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
