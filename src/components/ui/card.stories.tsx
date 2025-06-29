import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "./card";

const meta: Meta = {
	title: "Components/UI/Card",
	component: Card,
	tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
	render: (args) => (
		<Card {...args}>
			<CardHeader>
				<CardTitle>Card Title</CardTitle>
				<CardDescription>Card Description</CardDescription>
			</CardHeader>
			<CardContent>
				<p>Card content goes here.</p>
			</CardContent>
			<CardFooter>
				<p>Card footer</p>
			</CardFooter>
		</Card>
	),
	args: {
		className: "",
	},
};

export const WithoutFooter: Story = {
	render: (args) => (
		<Card {...args}>
			<CardHeader>
				<CardTitle>Card Title</CardTitle>
				<CardDescription>Card Description</CardDescription>
			</CardHeader>
			<CardContent>
				<p>Card content goes here.</p>
			</CardContent>
		</Card>
	),
};
