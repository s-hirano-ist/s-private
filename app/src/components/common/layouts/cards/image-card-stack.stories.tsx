import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ImageCardStack } from "./image-card-stack";

const meta = {
	component: ImageCardStack,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof ImageCardStack>;

export default meta;

type Story = StoryObj<typeof meta>;

const mockData = [
	{
		id: "1",
		isbn: "1111111111",
		href: "/example/1111111111",
		title: "sample title 1",
		image: "https://picsum.photos/id/1/192/192",
	},
	{
		id: "2",
		isbn: "2222222222",
		href: "/example/2222222222",
		title: "sample title 2",
		image: "https://picsum.photos/id/1/192/192",
	},
	{
		id: "3",
		isbn: "3333333333",
		href: "/example/3333333333",
		title: "sample title 3",
		image: "https://picsum.photos/id/1/192/192",
	},
	{
		id: "4",
		isbn: "4444444444",
		href: "/example/4444444444",
		title: "sample title 4",
		image: "https://picsum.photos/id/1/192/192",
	},
	{
		id: "5",
		isbn: "5555555555",
		href: "/example/5555555555",
		title: "sample title 5",
		image: "https://picsum.photos/id/1/192/192",
	},
	{
		id: "6",
		isbn: "6666666666",
		href: "/example/6666666666",
		title: "sample title 6",
		image: "https://picsum.photos/id/1/192/192",
	},
];
const basePath = "/example";

export const Default: Story = {
	args: {
		initial: { data: mockData, totalCount: 10 },
		basePath,
		deleteAction: fn(() =>
			Promise.resolve({ success: true, message: "Deleted successfully" }),
		),
		loadMoreAction: fn(() =>
			Promise.resolve({
				success: true,
				message: "Loaded more data",
				data: { data: [], totalCount: 10 },
			}),
		),
	},
};
