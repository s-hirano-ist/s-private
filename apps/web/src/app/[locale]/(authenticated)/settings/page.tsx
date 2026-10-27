import {
	sendTestPush,
	subscribeToPush,
	unsubscribeFromPush,
} from "@/application-services/push-notifications/actions";
import { SettingsActions } from "@/components/common/layouts/nav/settings-actions";
import { env } from "@/env";

export default function Page() {
	return (
		<div className="mx-auto max-w-xl p-4">
			<SettingsActions
				publicKey={env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ?? ""}
				sendTestPush={sendTestPush}
				subscribeToPush={subscribeToPush}
				unsubscribeFromPush={unsubscribeFromPush}
			/>
		</div>
	);
}
