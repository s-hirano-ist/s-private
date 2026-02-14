import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EditableImageStack, ImageStack } from "./image-stack";

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

const imageStackMeta = {
	component: ImageStack,
} satisfies Meta<typeof ImageStack>;

export default imageStackMeta;

type ImageStackStory = StoryObj<typeof imageStackMeta>;

export const Default: ImageStackStory = {
	args: {
		data: mockData,
	},
};

export const NoData: ImageStackStory = {
	args: {
		data: [],
	},
};

const editableImageStackMeta = {
	component: EditableImageStack,
} satisfies Meta<typeof EditableImageStack>;

type EditableImageStackStory = StoryObj<typeof editableImageStackMeta>;

export const WithDeleteButton: EditableImageStackStory = {
	parameters: { a11y: { test: "todo" } },
	render: (args) => <EditableImageStack {...args} />,
	args: {
		data: mockData,
		deleteAction: async () => ({ success: true, message: "deleted" }),
	},
};
