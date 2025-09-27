import { forbidden, unstable_rethrow } from "next/navigation";
import type { ReactNode } from "react";
import { SystemErrorEvent } from "s-private-domains/common/events/system-error-event";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import { initializeEventHandlers } from "@/infrastructures/events/event-setup";
import { StatusCodeView } from "../display/status/status-code-view";

type Props = {
	render: () => Promise<ReactNode>;
	permissionCheck: () => Promise<boolean>;
	errorCaller: string;
	fallback?: ReactNode;
};

export async function ErrorPermissionBoundary({
	render,
	permissionCheck,
	errorCaller,
	fallback,
}: Props) {
	const hasPermission = await permissionCheck();
	if (!hasPermission) forbidden();

	try {
		return await render();
	} catch (error) {
		unstable_rethrow(error);

		initializeEventHandlers();
		await eventDispatcher.dispatch(
			new SystemErrorEvent({
				message: "unexpected",
				status: 500,
				caller: errorCaller,
				extraData: error,
			}),
		);

		if (fallback) return fallback;

		return (
			<div className="flex flex-col items-center">
				<StatusCodeView statusCode="500" />
			</div>
		);
	}
}
