import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BooksStackClient } from "./client";

const meta = {
	component: BooksStackClient,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof BooksStackClient>;

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
		href: "0011223344",
		title: "sample title",
		image,
	},
];

export const Default: Story = {
	args: {
		totalBooks: 10,
		previewCardData: mockData,
	},
};
