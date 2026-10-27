import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { AuthErrorView } from "./auth-error-view";

const meta = {
	component: AuthErrorView,
	parameters: { layout: "fullscreen" },
	args: {
		errorCode: "state_mismatch",
		errorCodeLabel: "Authentication error code",
		retryLabel: "Sign in again",
		statusMessage: "Sign in error.",
	},
} satisfies Meta<typeof AuthErrorView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const OAuthError: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByText("state_mismatch")).toBeVisible();
		await expect(
			canvas.getByRole("link", { name: "Sign in again" }),
		).toHaveAttribute("href", "/api/sign-in");
	},
};

export const UnknownError: Story = {
	args: { errorCode: "unknown" },
	play: async ({ canvas }) => {
		await expect(canvas.getByText("unknown")).toBeVisible();
	},
};
