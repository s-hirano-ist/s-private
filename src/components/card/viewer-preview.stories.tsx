import type { Meta, StoryObj } from "@storybook/react";
import { ViewerPreview } from "./viewer-preview";

const meta = {
	title: "Components/Card/ViewerPreview",
	component: ViewerPreview,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof ViewerPreview>;

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
		image: {
			title: "sample title",
			uint8ArrayImage,
		},
		path: "/example",
		imageType: "svg",
	},
};
