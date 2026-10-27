import { reauthenticate } from "@/common/auth/reauthenticate";
import { authClient } from "@/infrastructures/auth/auth-client";
import { afterEach, expect, test, vi } from "vite-plus/test";

vi.mock("@/infrastructures/auth/auth-client", () => ({
	authClient: { signOut: vi.fn() },
}));
afterEach(() => {
	vi.unstubAllGlobals();
	vi.clearAllMocks();
});

test("clears the session before navigating to sign-in", async () => {
	const assign = vi.fn();
	vi.stubGlobal("window", { location: { assign } });
	vi.mocked(authClient.signOut).mockResolvedValue({
		data: { success: true },
		error: null,
	});
	await reauthenticate();
	expect(assign).toHaveBeenCalledWith("/api/sign-in");
	expect(authClient.signOut).toHaveBeenCalledOnce();
});

test("does not navigate on API failure", async () => {
	const assign = vi.fn();
	vi.stubGlobal("window", { location: { assign } });
	vi.mocked(authClient.signOut).mockResolvedValue({
		data: null,
		error: { status: 500, statusText: "Error", message: "Failed" },
	});
	await expect(reauthenticate()).rejects.toThrow("Sign out failed");
	expect(assign).not.toHaveBeenCalled();
});
test("does not navigate on network failure", async () => {
	const assign = vi.fn();
	vi.stubGlobal("window", { location: { assign } });
	vi.mocked(authClient.signOut).mockRejectedValue(new Error("offline"));
	await expect(reauthenticate()).rejects.toThrow("offline");
	expect(assign).not.toHaveBeenCalled();
});
