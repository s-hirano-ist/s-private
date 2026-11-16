import {
	getPushStatus,
	sendTestPush,
	subscribeToPush,
	unsubscribeFromPush,
} from "@/application-services/push-notifications/actions";
import { SettingsActions } from "@/components/common/layouts/nav/settings-actions";

export default function Page() {
	return (
		<div className="mx-auto max-w-xl px-3 pt-6 sm:px-0">
			<SettingsActions
				getPushStatus={getPushStatus}
				sendTestPush={sendTestPush}
				subscribeToPush={subscribeToPush}
				unsubscribeFromPush={unsubscribeFromPush}
			/>
		</div>
	);
}
