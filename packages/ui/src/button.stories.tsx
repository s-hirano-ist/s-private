import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Button } from "./button.js";

const meta = {
	component: Button,
	parameters: {
		layout: "centered",
	},
	argTypes: {
		disabled: { control: { type: "boolean" } },
		size: {
			control: { type: "select" },
			options: ["default", "sm", "lg", "icon"],
		},
		variant: {
			control: { type: "select" },
			options: [
				"default",
				"destructive",
				"outline",
				"secondary",
				"ghost",
				"link",
			],
		},
		onClick: { action: "clicked" },
	},
	args: {
		onClick: fn(),
	},
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: "ボタン",
	},
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(canvas.getByRole("button", { name: "ボタン" }));
		await expect(args.onClick).toHaveBeenCalledOnce();
	},
};

export const Disabled: Story = {
	args: {
		children: "無効なボタン",
		disabled: true,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByRole("button", { name: "無効なボタン" }),
		).toBeDisabled();
	},
};

export const Composed: Story = {
	render: () => (
		<Button
			ref={(element) => {
				if (element) element.dataset.refAttached = "true";
			}}
			render={
				<button
					aria-label="Composed button"
					data-testid="composed-button"
					type="button"
				/>
			}
		>
			Composed button
		</Button>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const button = canvas.getByTestId("composed-button");
		await expect(button.tagName).toBe("BUTTON");
		await expect(button).toHaveAttribute("data-ref-attached", "true");
	},
};
export const Destructive: Story = {
	args: {
		children: "ボタン",
		variant: "destructive",
	},
};
export const Outline: Story = {
	args: {
		children: "ボタン",
		variant: "outline",
	},
};
export const Secondary: Story = {
	args: {
		children: "ボタン",
		variant: "secondary",
	},
};
export const Ghost: Story = {
	args: {
		children: "ボタン",
		variant: "ghost",
	},
};
export const Link: Story = {
	args: {
		children: "ボタン",
		variant: "link",
	},
};
// Example with different backgrounds
export const OnDarkBackground: Story = {
	args: {
		children: "ボタン",
		variant: "outline",
	},
	globals: {
		backgrounds: { value: "dark" },
	},
};

// Example with mobile viewport
export const MobileView: Story = {
	args: {
		children: "ボタン",
		size: "sm",
	},
	globals: {
		viewport: { value: "mobile1" },
	},
};
