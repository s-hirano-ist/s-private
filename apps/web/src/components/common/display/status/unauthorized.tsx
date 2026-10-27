"use client";

import { reauthenticate } from "@/common/auth/reauthenticate";
import { StatusCodeView } from "@/components/common/display/status/status-code-view";
import { Button } from "@s-hirano-ist/s-ui/button";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

export function Unauthorized() {
	const t = useTranslations("unauthorized");
	const inFlight = useRef(false);
	const [pending, setPending] = useState(false);
	const [failed, setFailed] = useState(false);
	async function retry() {
		if (inFlight.current) return;
		inFlight.current = true;
		setPending(true);
		setFailed(false);
		try {
			await reauthenticate();
		} catch {
			setFailed(true);
			setPending(false);
			inFlight.current = false;
		}
	}
	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
			<StatusCodeView statusCode="401" statusCodeString={t("description")} />
			<Button variant="outline" disabled={pending} onClick={retry}>
				{pending ? t("pending") : t("retry")}
			</Button>
			{failed ? <p role="alert">{t("failed")}</p> : null}
		</div>
	);
}
