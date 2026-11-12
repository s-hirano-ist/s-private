import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { openFeedback } from "@/common/observability/feedback";
import { FeedbackButton } from "@/components/common/layouts/nav/feedback-button";
import { expect, mocked, userEvent, waitFor } from "storybook/test";

const meta = {
	component: FeedbackButton,
	beforeEach: () => {
		mocked(openFeedback).mockReset().mockResolvedValue(undefined);
	},
} satisfies Meta<typeof FeedbackButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Japanese: Story = {
	globals: { locale: "ja" },
	play: async ({ canvas }) => {
		const button = canvas.getByRole("button", { name: "フィードバック" });
		button.focus();
		await userEvent.keyboard("{Enter}");
		await waitFor(() =>
			expect(openFeedback).toHaveBeenCalledWith(
				expect.objectContaining({ submitButtonLabel: "送信" }),
			),
		);
		await expect(button).toBeEnabled();
	},
};
export const English: Story = {
	globals: { locale: "en" },
	play: async ({ canvas }) => {
		await userEvent.click(canvas.getByRole("button", { name: "Feedback" }));
		await waitFor(() =>
			expect(openFeedback).toHaveBeenCalledWith(
				expect.objectContaining({ submitButtonLabel: "Send feedback" }),
			),
		);
	},
};
export const Unavailable: Story = {
	beforeEach: () => {
		mocked(openFeedback).mockRejectedValue(new Error("unavailable"));
	},
	play: async ({ canvas }) => {
		await userEvent.click(canvas.getByRole("button"));
		await expect(await canvas.findByRole("alert")).toBeVisible();
		await expect(canvas.getByRole("button")).toBeEnabled();
	},
};
