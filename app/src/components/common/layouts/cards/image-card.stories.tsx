import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ImageCard } from "./image-card";

const meta = {
	component: ImageCard,
	parameters: { layout: "centered" },
} satisfies Meta<typeof ImageCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		data: {
			id: "1",
			href: "0011223344",
			title: "sample title",
			image: "https://picsum.photos/id/1/192/192",
		},
		basePath: "/example",
	},
};
