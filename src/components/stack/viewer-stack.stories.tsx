import type { Meta, StoryObj } from "@storybook/react";
import { ViewerStack } from "./viewer-stack";

const meta = {
	title: "Components/Stack/ViewerStack",
	component: ViewerStack,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof ViewerStack>;

export default meta;

type Story = StoryObj<typeof meta>;

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <circle cx="50" cy="50" r="40" fill="blue" />
</svg>`;
const encoder = new TextEncoder();
const uint8ArrayImage = encoder.encode(svg);

export const Default: Story = {
	args: {
		images: [
			{
				title: "sample title 1",
				uint8ArrayImage,
			},
			{
				title: "sample title 2",
				uint8ArrayImage,
			},
			{
				title: "sample title 3",
				uint8ArrayImage,
			},
			{
				title: "sample title 4",
				uint8ArrayImage,
			},
			{
				title: "sample title 5",
				uint8ArrayImage,
			},
			{
				title: "sample title 6",
				uint8ArrayImage,
			},
		],
		path: "/example",
		imageType: "svg",
	},
};
