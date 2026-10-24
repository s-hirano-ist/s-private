import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { reauthenticate } from "@/common/auth/reauthenticate";
import { expect, mocked, waitFor } from "storybook/test";
import { Unauthorized } from "./unauthorized";

const meta = {
	component: Unauthorized,
	parameters: { layout: "fullscreen" },
	beforeEach() {
		mocked(reauthenticate).mockReset();
		mocked(reauthenticate).mockResolvedValue(undefined);
	},
} satisfies Meta<typeof Unauthorized>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Japanese: Story = {
	globals: { locale: "ja" },
	play: async ({ canvas }) => {
		await waitFor(() => expect(canvas.getByText("401")).toBeVisible());
		await expect(
			canvas.getByRole("button", { name: "サインアウトして再ログイン" }),
		).toBeEnabled();
	},
};
export const English: Story = {
	globals: { locale: "en" },
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole("button", { name: "Sign out and sign in again" }),
		).toBeEnabled();
	},
};
export const Pending: Story = {
	beforeEach() {
		mocked(reauthenticate).mockImplementation(() => new Promise(() => {}));
	},
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByRole("button"));
		await expect(canvas.getByRole("button")).toBeDisabled();
		await userEvent.keyboard("{Enter}");
		await expect(reauthenticate).toHaveBeenCalledTimes(1);
	},
};
export const FailureAndRetry: Story = {
	beforeEach() {
		mocked(reauthenticate).mockRejectedValueOnce(new Error("Network error"));
	},
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByRole("button"));
		await expect(canvas.getByRole("alert")).toBeVisible();
		await expect(canvas.getByRole("button")).toBeEnabled();
		await userEvent.click(canvas.getByRole("button"));
		await expect(reauthenticate).toHaveBeenCalledTimes(2);
		await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
		await expect(canvas.getByRole("button")).toBeDisabled();
	},
};
