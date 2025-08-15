import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ImageCard } from "./image-card";

const meta = {
	component: ImageCard,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof ImageCard>;

export default meta;

type Story = StoryObj<typeof meta>;

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <circle cx="50" cy="50" r="40" fill="blue" />
</svg>`;
const encoder = new TextEncoder();
const image = encoder.encode(svg);

export const Default: Story = {
	args: {
		data: {
			href: "0011223344",
			title: "sample title",
			image: "https://picsum.photos/id/1/192/192",
		},
		basePath: "/example",
	},
};
