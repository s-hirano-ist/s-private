import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ContentsStackClient } from "./client";

const meta = {
	component: ContentsStackClient,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof ContentsStackClient>;

export default meta;
type Story = StoryObj<typeof meta>;

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <circle cx="50" cy="50" r="40" fill="blue" />
</svg>`;
const encoder = new TextEncoder();
const image = encoder.encode(svg);

const mockData = [
	{
		id: 1,
		isbn: "1111111111",
		href: "/example/1111111111",
		title: "sample title 1",
		image: "https://picsum.photos/id/1/192/192",
	},
	{
		id: 2,
		isbn: "2222222222",
		href: "/example/2222222222",
		title: "sample title 2",
		image: "https://picsum.photos/id/1/192/192",
	},
	{
		id: 3,
		isbn: "3333333333",
		href: "/example/3333333333",
		title: "sample title 3",
		image: "https://picsum.photos/id/1/192/192",
	},
	{
		id: 4,
		isbn: "4444444444",
		href: "/example/4444444444",
		title: "sample title 4",
		image: "https://picsum.photos/id/1/192/192",
	},
	{
		id: 5,
		isbn: "5555555555",
		href: "/example/5555555555",
		title: "sample title 5",
		image: "https://picsum.photos/id/1/192/192",
	},
	{
		id: 6,
		isbn: "6666666666",
		href: "/example/6666666666",
		title: "sample title 6",
		image: "https://picsum.photos/id/1/192/192",
	},
];

export const Default: Story = { args: { data: mockData } };
