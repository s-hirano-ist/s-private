"use server";
import "server-only";
import { forbidden } from "next/navigation";
import { wrapServerSideErrorForClient } from "@/common/error/error-wrapper";
import type { ServerAction } from "@/common/types";

type PermissionCheck = () => Promise<boolean>;

export function withPermissionCheck<TArgs extends unknown[]>(
	permissionCheck: PermissionCheck,
	action: (...args: TArgs) => Promise<ServerAction>,
) {
	return async (...args: TArgs): Promise<ServerAction> => {
		const hasPermission = await permissionCheck();
		if (!hasPermission) forbidden();

		try {
			return await action(...args);
		} catch (error) {
			// Extract FormData from args if present for error context
			const formData = args.find(
				(arg): arg is FormData => arg instanceof FormData,
			);
			return await wrapServerSideErrorForClient(error, formData);
		}
	};
}
