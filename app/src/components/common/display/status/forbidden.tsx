"use client";
import { useTranslations } from "next-intl";
import { Button } from "@/components/common/ui/button";
import { StatusCodeView } from "./status-code-view";

export function Forbidden() {
	const t = useTranslations("label");

	return (
		<div className="space-y-2">
			<StatusCodeView statusCode="403" />
			<form action="/api/auth/signout" className="flex flex-col" method="post">
				<Button className="mx-auto" type="submit">
					{t("resignIn")}
				</Button>
			</form>
		</div>
	);
}
