"use client";

import type { PushNotificationButtonProps } from "./push-notification-button";
import { clearSessionDrafts } from "@/common/forms/session-draft";
import { authClient } from "@/infrastructures/auth/auth-client";
import { Link } from "@/infrastructures/i18n/routing";
import { RssIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { UtilButtons } from "./util-buttons";

export function SettingsActions(props: PushNotificationButtonProps) {
	const t = useTranslations("rss");
	return (
		<div className="space-y-6">
			<Link
				href="/settings/rss"
				className="flex items-center gap-3 rounded-xl border p-4 font-medium transition-colors hover:bg-accent"
			>
				<RssIcon aria-hidden="true" className="size-5" />
				{t("manageSubscriptions")}
			</Link>
			<UtilButtons
				handleReload={() => window.location.reload()}
				onSignOutSubmit={async () => {
					clearSessionDrafts();
					await authClient.signOut();
					window.location.href = "/";
				}}
				{...props}
			/>
		</div>
	);
}
