import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { PushNotificationButton } from "./push-notification-button";

const meta = {
	component: PushNotificationButton,
	parameters: { layout: "centered" },
	args: {
		publicKey: "",
		sendTestPush: fn(),
		subscribeToPush: fn(),
		unsubscribeFromPush: fn(),
	},
} satisfies Meta<typeof PushNotificationButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unsupported: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(canvas.getByRole("button", { name: /Web Push/u }));
		await expect(
			within(document.body).getByText(
				"このブラウザまたは環境ではWeb Push通知を利用できません。",
			),
		).toBeInTheDocument();
	},
};
