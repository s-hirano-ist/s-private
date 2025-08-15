import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ImageStack } from "./image-stack";

const meta = {
	component: ImageStack,
	tags: ["autodocs"],
} satisfies Meta<typeof ImageStack>;

export default meta;

type Story = StoryObj<typeof meta>;

const mockData = [
	{
		id: "1",
		originalPath: "https://picsum.photos/id/1/192/192",
		thumbnailPath: "https://picsum.photos/id/1/192/192",
		width: 192,
		height: 192,
	},
	{
		id: "2",
		originalPath: "https://picsum.photos/id/2/192/192",
		thumbnailPath: "https://picsum.photos/id/2/192/192",
		width: 192,
		height: 192,
	},
	{
		id: "3",
		originalPath: "https://picsum.photos/id/3/192/192",
		thumbnailPath: "https://picsum.photos/id/3/192/192",
		width: 192,
		height: 192,
	},
];

export const Default: Story = {
	args: {
		data: mockData,
		showDeleteButton: false,
	},
};

export const WithDeleteButton: Story = {
	args: {
		data: mockData,
		showDeleteButton: true,
		deleteAction: async () => ({ success: true, message: "deleted" }),
	},
};

export const NoData: Story = {
	args: {
		data: [],
		showDeleteButton: false,
	},
};
