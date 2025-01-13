import type { Meta, StoryObj } from "@storybook/react";
import { ViewerPreview } from "./viewer-preview";

const meta = {
	title: "Features/Viewer/ViewerPreview",
	component: ViewerPreview,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof ViewerPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		image: {
			title: "sample title",
			uint8ArrayImage: new Uint8Array([10, 20, 30, 40, 50]),
		},
		path: "/example",
		imageType: "webp",
	},
};
