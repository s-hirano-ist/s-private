"use client";

import { Button } from "@s-hirano-ist/s-ui/button";
import { MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function FeedbackButton() {
	const t = useTranslations("feedback");
	const [loading, setLoading] = useState(false);
	const [failed, setFailed] = useState(false);
	async function open() {
		setLoading(true);
		setFailed(false);
		try {
			const { openFeedback } = await import("@/common/observability/feedback");
			await openFeedback({
				formTitle: t("title"),
				isRequiredLabel: t("requiredLabel"),
				messageLabel: t("notice"),
				messagePlaceholder: t("placeholder"),
				submitButtonLabel: t("submit"),
				cancelButtonLabel: t("cancel"),
				successMessageText: t("success"),
				errorGenericText: t("error"),
				errorEmptyMessageText: t("required"),
			});
		} catch {
			setFailed(true);
		} finally {
			setLoading(false);
		}
	}
	return (
		<>
			<Button
				className="flex h-16 flex-col items-center gap-1"
				variant="outline"
				disabled={loading}
				onClick={() => {
					void open();
				}}
			>
				<MessageSquare className="size-5" aria-hidden="true" />
				<span className="text-xs">{t("button")}</span>
			</Button>
			{failed ? (
				<p role="alert" className="text-sm">
					{t("error")}
				</p>
			) : null}
		</>
	);
}
