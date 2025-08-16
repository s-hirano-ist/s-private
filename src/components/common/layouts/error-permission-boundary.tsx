import { forbidden } from "next/navigation";
import type { ReactNode } from "react";
import { serverLogger } from "@/infrastructures/observability/server";
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
}: Props) {
	const hasPermission = await permissionCheck();
	if (!hasPermission) forbidden();

	try {
		return await render();
	} catch (error) {
		serverLogger.error(
			"unexpected",
			{ caller: errorCaller, status: 500 },
			error,
		);

		return (
			<div className="flex flex-col items-center">
				<StatusCodeView statusCode="500" />
			</div>
		);
	}
}
