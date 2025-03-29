import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
	title: "Components/UI/Dialog",
	component: Dialog,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
	render: () => (
		<Dialog>
			<DialogTrigger asChild>
				<Button>Open Dialog</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Dialog Title</DialogTitle>
					<DialogDescription>
						This is the dialog description. It gives more details about the
						dialog content.
					</DialogDescription>
				</DialogHeader>
				<p>This is the main content of the dialog.</p>
				<DialogFooter>
					<Button variant="secondary">Cancel</Button>
					<Button>Confirm</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	),
};

export const WithoutFooter: Story = {
	render: () => (
		<Dialog>
			<DialogTrigger asChild>
				<Button>Open Dialog</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Dialog Title</DialogTitle>
					<DialogDescription>
						This is the dialog description. It gives more details about the
						dialog content.
					</DialogDescription>
				</DialogHeader>
				<p>This is the main content of the dialog.</p>
			</DialogContent>
		</Dialog>
	),
};

export const LongContents: Story = {
	render: () => (
		<Dialog>
			<DialogTrigger asChild>
				<Button>Open Dialog</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Long Content</DialogTitle>
					<DialogDescription>
						This dialog contains a lot of content to demonstrate scrolling
						behavior.
					</DialogDescription>
				</DialogHeader>
				<div style={{ maxHeight: "200px", overflowY: "auto" }}>
					{[...Array(20)].map((_, i) => (
						<p key={String(i)}>This is some long content. Line {i + 1}</p>
					))}
				</div>
				<DialogFooter>
					<Button variant="secondary">Cancel</Button>
					<Button>Confirm</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	),
};

export const CustomStyled: Story = {
	render: () => (
		<Dialog>
			<DialogTrigger asChild>
				<Button>Open Dialog</Button>
			</DialogTrigger>
			<DialogContent className="bg-primary text-white">
				<DialogHeader>
					<DialogTitle>Custom Styled Dialog</DialogTitle>
					<DialogDescription>
						This dialog has custom styles applied.
					</DialogDescription>
				</DialogHeader>
				<p>This is the main content of the custom styled dialog.</p>
				<DialogFooter>
					<Button variant="secondary">Cancel</Button>
					<Button>Confirm</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	),
};
