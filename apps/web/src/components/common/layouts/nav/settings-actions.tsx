"use client";

import type { PushNotificationButtonProps } from "./push-notification-button";
import { clearSessionDrafts } from "@/common/forms/session-draft";
import { authClient } from "@/infrastructures/auth/auth-client";
import { UtilButtons } from "./util-buttons";

export function SettingsActions(props: PushNotificationButtonProps) {
	return (
		<UtilButtons
			handleReload={() => window.location.reload()}
			onSignOutSubmit={async () => {
				clearSessionDrafts();
				await authClient.signOut();
				window.location.href = "/";
			}}
			{...props}
		/>
	);
}
