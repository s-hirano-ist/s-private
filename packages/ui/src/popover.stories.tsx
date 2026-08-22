import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "./button.js";
import { Input } from "./input.js";
import { Label } from "./label.js";
import { Popover, PopoverContent, PopoverTrigger } from "./popover.js";

const meta = {
	component: Popover,
	parameters: { layout: "centered" },
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Popover>
			<PopoverTrigger render={<Button variant="outline" />}>
				Open Popover
			</PopoverTrigger>
			<PopoverContent>
				<p>This is the popover content.</p>
			</PopoverContent>
		</Popover>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const body = within(document.body);
		const trigger = canvas.getByRole("button", { name: "Open Popover" });

		await userEvent.click(trigger);
		await waitFor(() =>
			expect(
				body.getByText("This is the popover content."),
			).toBeInTheDocument(),
		);
		await userEvent.keyboard("{Escape}");
		await waitFor(() =>
			expect(
				body.queryByText("This is the popover content."),
			).not.toBeInTheDocument(),
		);
		await expect(trigger).toHaveFocus();
	},
};

export const WithForm: Story = {
	render: () => (
		<Popover>
			<PopoverTrigger render={<Button variant="outline" />}>
				Edit Settings
			</PopoverTrigger>
			<PopoverContent className="w-80">
				<div className="grid gap-4">
					<div className="space-y-2">
						<h4 className="leading-none font-medium">Settings</h4>
						<p className="text-sm text-muted-foreground">
							Configure your preferences.
						</p>
					</div>
					<div className="grid gap-2">
						<div className="grid grid-cols-3 items-center gap-4">
							<Label htmlFor="width">Width</Label>
							<Input
								className="col-span-2 h-8"
								defaultValue="100%"
								id="width"
							/>
						</div>
						<div className="grid grid-cols-3 items-center gap-4">
							<Label htmlFor="height">Height</Label>
							<Input
								className="col-span-2 h-8"
								defaultValue="auto"
								id="height"
							/>
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	),
};
