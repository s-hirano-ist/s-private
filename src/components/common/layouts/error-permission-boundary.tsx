import { forbidden } from "next/navigation";
import type { ReactNode } from "react";
import { serverLogger } from "@/infrastructures/observability/server";
import { StatusCodeView } from "../display/status/status-code-view";

type Props = {
	children: ReactNode;
	permissionCheck: () => Promise<boolean>;
	errorCaller: string;
};

export async function ErrorPermissionBoundary({
	children,
	permissionCheck,
	errorCaller,
}: Props) {
	const hasPermission = await permissionCheck();
	if (!hasPermission) forbidden();

	try {
		return <>{children}</>;
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
