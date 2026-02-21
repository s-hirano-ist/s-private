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

export const WithMetadata: Story = {
	args: {
		data: {
			id: "2",
			href: "9784065211234",
			title: "The Pragmatic Programmer",
			image: "https://picsum.photos/id/24/192/192",
			authors: "David Thomas, Andrew Hunt",
			subtitle: "Your Journey to Mastery",
		},
		basePath: "book",
	},
};

export const WithoutImage: Story = {
	args: {
		data: {
			id: "3",
			href: "9784065211235",
			title: "Book Without Cover Image",
			image: null,
			authors: "Unknown Author",
		},
		basePath: "book",
	},
};

export const MinimalData: Story = {
	args: {
		data: {
			id: "4",
			href: "9784065211236",
			title: "Book With Only Title",
			image: "https://picsum.photos/id/42/192/192",
		},
		basePath: "book",
	},
};
