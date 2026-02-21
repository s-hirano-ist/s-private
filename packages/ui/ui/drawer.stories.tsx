import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "./button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "./drawer";

const meta = {
	component: Drawer,
	parameters: { layout: "centered" },
} satisfies Meta<typeof Drawer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Drawer>
			<DrawerTrigger render={<Button variant="outline" />}>
				Open Drawer
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Drawer Title</DrawerTitle>
					<DrawerDescription>
						This is the drawer description providing more context.
					</DrawerDescription>
				</DrawerHeader>
				<DrawerFooter>
					<DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const body = within(document.body);

		const trigger = canvas.getByRole("button", { name: "Open Drawer" });
		await userEvent.click(trigger);

		await waitFor(() =>
			expect(body.getByText("Drawer Title")).toBeInTheDocument(),
		);
		await expect(
			body.getByText("This is the drawer description providing more context."),
		).toBeInTheDocument();

		const closeButton = body.getByRole("button", { name: "Close" });
		await userEvent.click(closeButton);

		await waitFor(() =>
			expect(body.queryByText("Drawer Title")).not.toBeInTheDocument(),
		);
	},
};

export const WithContent: Story = {
	render: () => (
		<Drawer>
			<DrawerTrigger render={<Button variant="outline" />}>
				Open Drawer
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Settings</DrawerTitle>
					<DrawerDescription>Adjust your preferences below.</DrawerDescription>
				</DrawerHeader>
				<div className="p-4">
					<p className="text-muted-foreground text-sm">
						This is the main content area of the drawer. You can place any
						content here, including forms, lists, or other UI elements.
					</p>
					<ul className="mt-4 space-y-2">
						<li className="rounded-md border p-2">Option 1</li>
						<li className="rounded-md border p-2">Option 2</li>
						<li className="rounded-md border p-2">Option 3</li>
					</ul>
				</div>
				<DrawerFooter>
					<Button>Save Changes</Button>
					<DrawerClose render={<Button variant="outline" />}>
						Cancel
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const body = within(document.body);

		const trigger = canvas.getByRole("button", { name: "Open Drawer" });
		await userEvent.click(trigger);

		await waitFor(() => expect(body.getByText("Settings")).toBeInTheDocument());
		await expect(body.getByText("Option 1")).toBeInTheDocument();
		await expect(body.getByText("Option 2")).toBeInTheDocument();
		await expect(body.getByText("Option 3")).toBeInTheDocument();
		await expect(
			body.getByRole("button", { name: "Save Changes" }),
		).toBeInTheDocument();

		const cancelButton = body.getByRole("button", { name: "Cancel" });
		await userEvent.click(cancelButton);

		await waitFor(() =>
			expect(body.queryByText("Settings")).not.toBeInTheDocument(),
		);
	},
};
