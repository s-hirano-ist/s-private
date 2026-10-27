import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ImagesStack } from "./images-stack";

const images = [1, 2, 3, 4].map((id) => ({
	id: String(id),
	originalPath: `https://picsum.photos/id/${id}/600/600`,
	thumbnailPath: `https://picsum.photos/id/${id}/192/192`,
	height: 600,
	width: 600,
}));

const meta = {
	component: ImagesStack,
	parameters: { layout: "padded" },
} satisfies Meta<typeof ImagesStack>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		initialData: { data: images, totalCount: 8 },
		loadMoreAction: async () => ({
			success: true,
			message: "success",
			data: {
				data: images.map((image) => ({ ...image, id: `more-${image.id}` })),
				totalCount: 8,
			},
		}),
		deleteAction: async () => ({ success: true, message: "Image deleted" }),
	},
};

export const Viewer: Story = {
	args: { ...Default.args, deleteAction: undefined },
};

export const Empty: Story = {
	args: { ...Default.args, initialData: { data: [], totalCount: 0 } },
};

export const AllLoaded: Story = {
	args: {
		...Default.args,
		initialData: { data: images, totalCount: images.length },
	},
};
