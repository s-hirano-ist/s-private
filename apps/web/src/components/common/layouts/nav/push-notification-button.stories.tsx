import type { PushBrowser } from "@/components/common/layouts/nav/push-browser";
import type { PushNotificationButtonProps } from "@/components/common/layouts/nav/push-notification-button";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PushNotificationButton } from "@/components/common/layouts/nav/push-notification-button";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

const publicKey = "AQID";
const subscription = (matching = false, keyMissing = false) => {
	const key = new Uint8Array(matching ? [1, 2, 3] : [4, 5, 6]).buffer;
	return {
		endpoint: matching
			? "https://push.example/new"
			: "https://push.example/old",
		options: {
			applicationServerKey: keyMissing ? null : key,
		},
		unsubscribe: fn(async () => true),
		toJSON: () => ({
			endpoint: matching
				? "https://push.example/new"
				: "https://push.example/old",
			keys: { auth: "auth", p256dh: "key" },
		}),
	} as unknown as PushSubscription;
};
const browser = (current: PushSubscription | null = null): PushBrowser => ({
	inspect: fn(async () => ({
		state: "checking" as const,
		subscription: current,
	})),
	subscribe: fn(async () => subscription(true)),
});
const meta = {
	component: PushNotificationButton,
	parameters: { layout: "centered" },
	args: {
		browser: browser(),
		getPushStatus: fn<PushNotificationButtonProps["getPushStatus"]>(
			async () => ({
				success: true,
				message: "",
				data: { publicKey, registered: true, requiresResubscribe: false },
			}),
		),
		sendTestPush: fn(async () => ({
			success: true,
			message: "pushTestSent",
		})),
		subscribeToPush: fn(async () => ({
			success: true,
			message: "pushSubscribed",
		})),
		unsubscribeFromPush: fn(async () => ({
			success: true,
			message: "pushUnsubscribed",
		})),
	},
} satisfies Meta<typeof PushNotificationButton>;
export default meta;
type Story = StoryObj<typeof meta>;
async function open(canvasElement: HTMLElement) {
	await userEvent.click(
		within(canvasElement).getByRole("button", { name: /Web Push/u }),
	);
	return within(canvasElement.ownerDocument.body);
}
export const MatchingKey: Story = {
	args: { browser: browser(subscription(true)) },
	play: async ({ canvasElement, args }) => {
		const screen = await open(canvasElement);
		await waitFor(async () =>
			expect(
				await screen.findByRole("button", { name: "テスト通知" }),
			).toBeVisible(),
		);
		await expect(args.subscribeToPush).not.toHaveBeenCalled();
	},
};
export const KeyMismatch: Story = {
	args: { browser: browser(subscription()) },
	play: async ({ canvasElement, args }) => {
		const screen = await open(canvasElement);
		await userEvent.click(
			await screen.findByRole("button", { name: "再登録" }),
		);
		await expect(args.subscribeToPush).toHaveBeenCalledWith(
			expect.objectContaining({
				applicationServerKey: publicKey,
				replacesEndpoint: "https://push.example/old",
			}),
		);
		await waitFor(async () =>
			expect(
				await screen.findByRole("button", { name: "テスト通知" }),
			).toBeVisible(),
		);
		await expect(args.sendTestPush).not.toHaveBeenCalled();
	},
};
export const ServerRequiresRenewal: Story = {
	args: {
		browser: browser(subscription(true)),
		getPushStatus: fn<PushNotificationButtonProps["getPushStatus"]>(
			async () => ({
				success: true,
				message: "",
				data: { publicKey, registered: true, requiresResubscribe: true },
			}),
		),
	},
	play: async ({ canvasElement }) => {
		const screen = await open(canvasElement);
		await waitFor(async () =>
			expect(
				await screen.findByRole("button", { name: "再登録" }),
			).toBeVisible(),
		);
	},
};
export const UnknownKey: Story = {
	args: { browser: browser(subscription(false, true)) },
	play: async ({ canvasElement }) => {
		const screen = await open(canvasElement);
		await waitFor(async () =>
			expect(
				await screen.findByRole("button", { name: "再登録" }),
			).toBeVisible(),
		);
	},
};
export const SaveRetry: Story = {
	beforeEach: ({ args }) => {
		args.subscribeToPush.mockResolvedValueOnce({
			success: false,
			message: "unexpected",
		});
	},
	args: {
		browser: browser(subscription()),
		subscribeToPush: fn(async () => ({
			success: true,
			message: "pushSubscribed",
		})),
	},
	play: async ({ canvasElement, args }) => {
		const screen = await open(canvasElement);
		await userEvent.click(
			await screen.findByRole("button", { name: "再登録" }),
		);
		await waitFor(() =>
			expect(
				screen.getByText(
					"ブラウザの登録は完了しています。通知を受信するために登録を保存してください。",
				),
			).toBeVisible(),
		);
		await userEvent.click(screen.getByRole("button", { name: "再登録" }));
		await waitFor(async () =>
			expect(
				await screen.findByRole("button", { name: "テスト通知" }),
			).toBeVisible(),
		);
		await expect(args.browser?.subscribe).toHaveBeenCalledTimes(1);
		await expect(args.subscribeToPush).toHaveBeenCalledTimes(2);
	},
};
export const UnregisteredCurrentKey: Story = {
	args: {
		browser: browser(subscription(true)),
		getPushStatus: fn<PushNotificationButtonProps["getPushStatus"]>(
			async () => ({
				success: true,
				message: "",
				data: { publicKey, registered: false, requiresResubscribe: false },
			}),
		),
	},
	play: async ({ canvasElement, args }) => {
		const screen = await open(canvasElement);
		await userEvent.click(
			await screen.findByRole("button", { name: "再登録" }),
		);
		await expect(args.browser?.subscribe).not.toHaveBeenCalled();
		await expect(args.subscribeToPush).toHaveBeenCalledTimes(1);
	},
};
export const PermissionDenied: Story = {
	args: {
		browser: {
			...browser(),
			inspect: fn(async () => ({
				state: "denied" as const,
				subscription: null,
			})),
		},
	},
	play: async ({ canvasElement, args }) => {
		const screen = await open(canvasElement);
		await waitFor(async () =>
			expect(
				await screen.findByText(
					"通知が拒否されています。ブラウザの設定からこのサイトの通知を許可してください。",
				),
			).toBeVisible(),
		);
		await expect(args.getPushStatus).not.toHaveBeenCalled();
	},
};
export const Unsupported: Story = {
	args: {
		browser: {
			...browser(),
			inspect: fn(async () => ({
				state: "unsupported" as const,
				subscription: null,
			})),
		},
	},
	play: async ({ canvasElement, args }) => {
		const screen = await open(canvasElement);
		await waitFor(async () =>
			expect(
				await screen.findByText(
					"このブラウザまたは環境ではWeb Push通知を利用できません。",
				),
			).toBeVisible(),
		);
		await expect(args.getPushStatus).not.toHaveBeenCalled();
	},
};

export const EnglishRenewal: Story = {
	globals: { locale: "en" },
	args: { browser: browser(subscription()) },
	play: async ({ canvasElement }) => {
		const screen = await open(canvasElement);
		await waitFor(async () =>
			expect(
				await screen.findByRole("button", { name: "Register again" }),
			).toBeVisible(),
		);
	},
};
export const StatusUnavailable: Story = {
	args: {
		getPushStatus: fn<PushNotificationButtonProps["getPushStatus"]>(
			async () => ({ success: false, message: "unexpected" }),
		),
	},
	play: async ({ canvasElement, args }) => {
		const screen = await open(canvasElement);
		await waitFor(async () =>
			expect(
				await screen.findByRole("button", { name: "再試行" }),
			).toBeVisible(),
		);
		await expect(args.browser?.subscribe).not.toHaveBeenCalled();
	},
};
export const SubscriptionFailure: Story = {
	args: {
		browser: {
			...browser(subscription()),
			subscribe: fn(async () => {
				throw new Error("unsubscribe failed");
			}),
		},
	},
	play: async ({ canvasElement, args }) => {
		const screen = await open(canvasElement);
		await userEvent.click(
			await screen.findByRole("button", { name: "再登録" }),
		);
		await expect(args.subscribeToPush).not.toHaveBeenCalled();
		await expect(
			await screen.findByRole("button", { name: "再登録" }),
		).toBeEnabled();
	},
};
