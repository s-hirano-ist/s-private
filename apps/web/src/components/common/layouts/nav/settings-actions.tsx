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
		<div>
			<UtilButtons
				handleReload={() => window.location.reload()}
				onSignOutSubmit={async () => {
					clearSessionDrafts();
					await authClient.signOut();
					window.location.href = "/";
				}}
				{...props}
			>
				<Link
					href="/settings/rss"
					className="flex h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-md border border-foreground/10 bg-background/60 px-2 text-center text-xs font-medium shadow-xs transition-colors backdrop-blur-sm hover:border-primary/30 hover:bg-background/90 hover:shadow-md focus-visible:ring-1 focus-visible:ring-primary active:scale-[0.97] focus-visible:outline-none"
				>
					<RssIcon aria-hidden="true" className="size-5" />
					<span>{t("manageSubscriptions")}</span>
				</Link>
			</UtilButtons>
		</div>
	);
}
