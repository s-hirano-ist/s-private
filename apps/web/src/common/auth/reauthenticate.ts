import { authClient } from "@/infrastructures/auth/auth-client";

export async function reauthenticate() {
	const result = await authClient.signOut();
	if (result.error) throw new Error("Sign out failed");
	window.location.assign("/api/sign-in");
}
