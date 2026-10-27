import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { BackButton } from "./back-button";

const meta = {
	component: BackButton,
	parameters: { layout: "centered", nextjs: { appDirectory: true } },
} satisfies Meta<typeof BackButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvasElement }) => {
		const button = within(canvasElement).getByRole("button", { name: "Back" });
		await userEvent.click(button);
		await expect(button).toBeEnabled();
	},
};
