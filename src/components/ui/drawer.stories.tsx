import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";

const meta = {
	title: "Components/UI/Drawer",
	component: Drawer,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof Drawer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
	render: () => (
		<Drawer>
			<DrawerTrigger asChild>
				<Button>Open Drawer</Button>
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Drawer Title</DrawerTitle>
					<DrawerDescription>
						This is the drawer description. It gives more details about the
						drawer content.
					</DrawerDescription>
				</DrawerHeader>
				<p>This is the main content of the drawer.</p>
				<DrawerFooter>
					<Button variant="secondary">Cancel</Button>
					<Button>Confirm</Button>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	),
};

export const WithoutFooter: Story = {
	render: () => (
		<Drawer>
			<DrawerTrigger asChild>
				<Button>Open Drawer</Button>
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Drawer Title</DrawerTitle>
					<DrawerDescription>
						This is the drawer description. It gives more details about the
						drawer content.
					</DrawerDescription>
				</DrawerHeader>
				<p>This is the main content of the drawer.</p>
			</DrawerContent>
		</Drawer>
	),
};

export const LongContents: Story = {
	render: () => (
		<Drawer>
			<DrawerTrigger asChild>
				<Button>Open Drawer</Button>
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Long Content</DrawerTitle>
					<DrawerDescription>
						This drawer contains a lot of content to demonstrate scrolling
						behavior.
					</DrawerDescription>
				</DrawerHeader>
				<div style={{ maxHeight: "200px", overflowY: "auto" }}>
					{Array.from({ length: 20 }).map((_, index) => (
						<p key={String(index)}>
							This is some long content. Line {index + 1}
						</p>
					))}
				</div>
				<DrawerFooter>
					<Button variant="secondary">Cancel</Button>
					<Button>Confirm</Button>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	),
};

export const CustomStyled: Story = {
	render: () => (
		<Drawer>
			<DrawerTrigger asChild>
				<Button>Open Drawer</Button>
			</DrawerTrigger>
			<DrawerContent className="bg-blue-500 text-white">
				<DrawerHeader>
					<DrawerTitle>Custom Styled Drawer</DrawerTitle>
					<DrawerDescription>
						This drawer has custom styles applied.
					</DrawerDescription>
				</DrawerHeader>
				<p>This is the main content of the custom styled drawer.</p>
				<DrawerFooter>
					<Button variant="secondary">Cancel</Button>
					<Button>Confirm</Button>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	),
};
