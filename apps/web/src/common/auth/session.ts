import "server-only";
import { getBackendClient } from "@/common/backend/server-client";
import { cache } from "react";

// The backend owns session validation. React only deduplicates within this request.
const checkSelfAuth = cache(async () => {
	const client = await getBackendClient();
	return (await client.getSession()).data;
});

export async function getSelfId(): Promise<string> {
	return (await checkSelfAuth()).user.id;
}

export async function requireAuth(): Promise<void> {
	await checkSelfAuth();
}
