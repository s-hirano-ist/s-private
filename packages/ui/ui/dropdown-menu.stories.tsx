import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./dropdown-menu";

const meta = {
	component: DropdownMenu,
	parameters: { layout: "centered" },
} satisfies Meta<typeof DropdownMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<DropdownMenu>
			<DropdownMenuTrigger>Open</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuLabel>My Account</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem>Profile</DropdownMenuItem>
				<DropdownMenuItem>Billing</DropdownMenuItem>
				<DropdownMenuItem>Team</DropdownMenuItem>
				<DropdownMenuItem>Subscription</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	),
};

export const OpenAndInteract: Story = {
	render: () => (
		<DropdownMenu>
			<DropdownMenuTrigger>Open</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuLabel>My Account</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem>Profile</DropdownMenuItem>
				<DropdownMenuItem>Billing</DropdownMenuItem>
				<DropdownMenuItem>Team</DropdownMenuItem>
				<DropdownMenuItem>Subscription</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const body = within(document.body);

		const trigger = canvas.getByText("Open");
		await userEvent.click(trigger);

		await waitFor(() =>
			expect(body.getByText("My Account")).toBeInTheDocument(),
		);
		await expect(body.getByText("Profile")).toBeInTheDocument();
		await expect(body.getByText("Billing")).toBeInTheDocument();
		await expect(body.getByText("Team")).toBeInTheDocument();
		await expect(body.getByText("Subscription")).toBeInTheDocument();

		await userEvent.click(body.getByText("Profile"));

		await waitFor(() =>
			expect(body.queryByText("My Account")).not.toBeInTheDocument(),
		);
	},
};
