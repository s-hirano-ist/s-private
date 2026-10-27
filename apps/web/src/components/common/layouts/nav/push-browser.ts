export type PushInspection = {
	state: "checking" | "denied" | "ios-install-required" | "unsupported";
	subscription: PushSubscription | null;
};
export type PushBrowser = {
	inspect(): Promise<PushInspection>;
	subscribe(
		publicKey: string,
		previous: PushSubscription | null,
	): Promise<PushSubscription>;
};
export function decodePushKey(value: string): Uint8Array<ArrayBuffer> {
	const raw = window.atob(value.replaceAll("-", "+").replaceAll("_", "/"));
	return Uint8Array.from(raw, (c) => c.codePointAt(0) ?? 0);
}
export function matchesPushKey(
	subscription: PushSubscription,
	publicKey: string,
): boolean {
	const current = subscription.options.applicationServerKey;
	if (!current) return false;
	const actual = new Uint8Array(current);
	const expected = decodePushKey(publicKey);
	return (
		actual.length === expected.length &&
		actual.every((byte, index) => byte === expected[index])
	);
}
export const pushBrowser: PushBrowser = {
	async inspect() {
		if (
			!("serviceWorker" in navigator) ||
			!("PushManager" in window) ||
			!("Notification" in window)
		)
			return { state: "unsupported", subscription: null };
		const isIos = /iphone|ipad|ipod/iu.test(navigator.userAgent);
		const standalone =
			window.matchMedia("(display-mode: standalone)").matches ||
			("standalone" in navigator && navigator.standalone === true);
		if (isIos && !standalone)
			return { state: "ios-install-required", subscription: null };
		if (Notification.permission === "denied")
			return { state: "denied", subscription: null };
		const registration = await navigator.serviceWorker.getRegistration("/");
		return {
			state: "checking",
			subscription: (await registration?.pushManager.getSubscription()) ?? null,
		};
	},
	async subscribe(publicKey, previous) {
		if (
			Notification.permission !== "granted" &&
			(await Notification.requestPermission()) !== "granted"
		)
			throw new Error("Notification permission denied");
		const registration = await navigator.serviceWorker.register(
			"/push-service-worker.js",
			{ scope: "/" },
		);
		await navigator.serviceWorker.ready;
		if (previous && !(await previous.unsubscribe()))
			throw new Error(
				"Could not unsubscribe previous notification registration",
			);
		return registration.pushManager.subscribe({
			applicationServerKey: decodePushKey(publicKey),
			userVisibleOnly: true,
		});
	},
};
