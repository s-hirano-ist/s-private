import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

const meta = {
	component: Popover,
	parameters: { layout: "centered" },
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline">Open Popover</Button>
			</PopoverTrigger>
			<PopoverContent>
				<p>This is the popover content.</p>
			</PopoverContent>
		</Popover>
	),
};

export const WithForm: Story = {
	render: () => (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline">Edit Settings</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80">
				<div className="grid gap-4">
					<div className="space-y-2">
						<h4 className="font-medium leading-none">Settings</h4>
						<p className="text-muted-foreground text-sm">
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
