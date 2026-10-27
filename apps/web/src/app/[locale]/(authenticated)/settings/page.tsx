import {
	getPushStatus,
	sendTestPush,
	subscribeToPush,
	unsubscribeFromPush,
} from "@/application-services/push-notifications/actions";
import { SettingsActions } from "@/components/common/layouts/nav/settings-actions";

export default function Page() {
	return (
		<div className="mx-auto max-w-xl p-4">
			<SettingsActions
				getPushStatus={getPushStatus}
				sendTestPush={sendTestPush}
				subscribeToPush={subscribeToPush}
				unsubscribeFromPush={unsubscribeFromPush}
			/>
		</div>
	);
}
