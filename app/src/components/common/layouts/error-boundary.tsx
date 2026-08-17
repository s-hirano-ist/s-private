import type { ReactNode } from "react";
import { StatusCodeView } from "@/components/common/display/status/status-code-view";
import { eventDispatcher } from "@/infrastructures/events/event-dispatcher";
import { initializeEventHandlers } from "@/infrastructures/events/event-setup";
import { SystemErrorEvent } from "@s-hirano-ist/s-core/shared-kernel/events/system-error-event";
import { getTranslations } from "next-intl/server";
import { unstable_rethrow } from "next/navigation";

type Props = {
	errorCaller: string;
	fallback?: ReactNode;
	render: () => Promise<ReactNode>;
};

export async function ErrorBoundary({ render, errorCaller, fallback }: Props) {
	const t = await getTranslations("statusCode");

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
				<StatusCodeView statusCode="500" statusCodeString={t("500")} />
			</div>
		);
	}
}
