import type { Meta, StoryObj } from "@storybook/react";
import { ViewerStack } from "./viewer-stack";

const meta = {
	title: "Features/Viewer/ViewerStack",
	component: ViewerStack,
	parameters: { layout: "centered", nextjs: { appDirectory: true } },
	tags: ["autodocs"],
} satisfies Meta<typeof ViewerStack>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		images: [
			{
				title: "sample title",
				uint8ArrayImage: new Uint8Array([10, 20, 30, 40, 50]),
			},
		],
		path: "/example",
		imageType: "webp",
	},
};
