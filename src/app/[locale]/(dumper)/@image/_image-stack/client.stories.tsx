import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ImageStackClient } from "./client";

const meta = {
	component: ImageStackClient,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof ImageStackClient>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockData = [
	{
		id: "https://picsum.photos/id/1/192/192",
		width: 192,
		height: 192,
	},
	{
		id: "https://picsum.photos/id/2/192/192",
		width: 192,
		height: 192,
	},
	{
		id: "https://picsum.photos/id/3/192/192",
		width: 192,
		height: 192,
	},
];

export const Default: Story = {
	args: { images: mockData },
};
