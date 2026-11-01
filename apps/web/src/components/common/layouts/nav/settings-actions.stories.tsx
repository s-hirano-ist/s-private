import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, within } from "storybook/test";
import { SettingsActions } from "./settings-actions";

const meta = {
	component: SettingsActions,
	args: {
		getPushStatus: fn().mockResolvedValue({
			success: false,
			message: "unexpected",
		}),
		sendTestPush: fn().mockResolvedValue({ message: "success", success: true }),
		subscribeToPush: fn().mockResolvedValue({
			message: "success",
			success: true,
		}),
		unsubscribeFromPush: fn().mockResolvedValue({
			message: "success",
			success: true,
		}),
	},
	parameters: {
		layout: "centered",
		nextjs: { appDirectory: true, navigation: { pathname: "/ja/settings" } },
	},
} satisfies Meta<typeof SettingsActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByTestId("log-out-button")).toBeVisible();
		await expect(
			canvas.getByRole("button", { name: /再読み込み/u }),
		).toBeVisible();
	},
};
