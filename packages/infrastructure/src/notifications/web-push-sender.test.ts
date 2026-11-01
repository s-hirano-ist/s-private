import {
	createWebPushSender,
	validatePushConfig,
} from "@s-hirano-ist/s-infrastructure/notifications/web-push-sender";
import { WebPushSendError } from "@s-hirano-ist/s-notification";
import { createECDH } from "node:crypto";
import { expect, test, vi } from "vitest";
const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("@s-hirano-ist/s-notification", async (original) => ({
	...(await original<typeof import("@s-hirano-ist/s-notification")>()),
	createWebPushService: () => ({ send }),
}));
const pair = createECDH("prime256v1");
pair.generateKeys();
const config = {
	NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY: pair.getPublicKey().toString("base64url"),
	WEB_PUSH_PRIVATE_KEY: pair.getPrivateKey().toString("base64url"),
	WEB_PUSH_SUBJECT: "mailto:test@example.com",
};
const payload = {
	title: "test",
	body: "body",
	icon: "/icon.png",
	tag: "test",
	url: "https://example.com",
};
test("derives the public key and rejects missing, malformed and mismatched pairs before transport", async () => {
	expect(validatePushConfig(config).publicKey).toBe(
		config.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
	);
	const short = createECDH("prime256v1");
	short.setPrivateKey(Buffer.from([1]));
	const other = createECDH("prime256v1");
	other.generateKeys();
	for (const invalid of [
		{},
		{ ...config, WEB_PUSH_PRIVATE_KEY: "invalid" },
		{
			...config,
			WEB_PUSH_PRIVATE_KEY: "AQ",
			NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY: short
				.getPublicKey()
				.toString("base64url"),
		},
		{
			...config,
			NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY: other
				.getPublicKey()
				.toString("base64url"),
		},
	]) {
		send.mockClear();
		await expect(
			createWebPushSender(invalid).send(
				{
					endpoint: "https://web.push.apple.com/test",
					auth: "auth",
					p256dh: "key",
				},
				payload,
			),
		).rejects.toMatchObject({ code: "UNAVAILABLE" });
		expect(send).not.toHaveBeenCalled();
	}
});
test.each([
	[400, "VapidPkHashMismatch", "web.push.apple.com", true],
	[400, "BadJwtToken", "web.push.apple.com", false],
	[401, "VapidPkHashMismatch", "web.push.apple.com", false],
	[403, "VapidPkHashMismatch", "web.push.apple.com", false],
	[400, "VapidPkHashMismatch", "push.example.com", false],
])(
	"classifies only Apple's exact key mismatch: %s %s %s",
	async (statusCode, reason, host, requiresResubscribe) => {
		send.mockRejectedValueOnce(
			new WebPushSendError({ statusCode, body: JSON.stringify({ reason }) }),
		);
		await expect(
			createWebPushSender(config).send(
				{ endpoint: `https://${host}/test`, auth: "auth", p256dh: "key" },
				payload,
			),
		).rejects.toMatchObject({ requiresResubscribe });
	},
);
