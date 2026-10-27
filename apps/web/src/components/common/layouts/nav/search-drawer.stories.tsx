import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { SearchDrawer } from "./search-drawer";

const meta = {
	component: SearchDrawer,
	parameters: { layout: "fullscreen" },
	args: {
		onOpenChange: fn(),
		open: true,
		search: fn(),
	},
} satisfies Meta<typeof SearchDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
	play: async () => {
		await expect(
			within(document.body).getByRole("textbox"),
		).toBeInTheDocument();
	},
};

export const CloseWithEscape: Story = {
	play: async ({ args }) => {
		await userEvent.keyboard("{Escape}");
		await expect(args.onOpenChange).toHaveBeenCalledWith(
			false,
			expect.anything(),
		);
	},
};
