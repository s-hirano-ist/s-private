import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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
};
