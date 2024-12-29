import "server-only";
import { headers } from "next/headers";

export async function getLoginUserInfo() {
	const headersList = await headers();
	const xForwardedFor = headersList.get("x-forwarded-for");
	const userAgent = headersList.get("user-agent") ?? undefined;
	return {
		ipAddress: xForwardedFor?.split(",")[0].trim(),
		userAgent,
	};
}
