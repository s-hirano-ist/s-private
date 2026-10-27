import {
	matchesPushKey,
	pushBrowser,
} from "@/components/common/layouts/nav/push-browser";
import { afterEach, expect, test, vi } from "vite-plus/test";
afterEach(() => vi.unstubAllGlobals());
test("compares key bytes, including padded URL base64 and unavailable keys", () => {
	const subscription = {
		options: { applicationServerKey: new Uint8Array([251, 255]).buffer },
	} as PushSubscription;
	expect(matchesPushKey(subscription, "-_8=")).toBe(true);
	expect(matchesPushKey(subscription, "AQID")).toBe(false);
	expect(
		matchesPushKey(
			{ options: { applicationServerKey: null } } as PushSubscription,
			"AQID",
		),
	).toBe(false);
});
test("an unsuccessful old unsubscribe prevents subscribing with the new key", async () => {
	const subscribe = vi.fn();
	const registration = { pushManager: { subscribe } };
	vi.stubGlobal("Notification", { permission: "granted" });
	vi.stubGlobal("navigator", {
		serviceWorker: {
			register: vi.fn().mockResolvedValue(registration),
			ready: Promise.resolve(registration),
		},
	});
	const previous = {
		unsubscribe: vi.fn().mockResolvedValue(false),
	} as unknown as PushSubscription;
	await expect(pushBrowser.subscribe("AQID", previous)).rejects.toThrow(
		"Could not unsubscribe",
	);
	expect(subscribe).not.toHaveBeenCalled();
});
