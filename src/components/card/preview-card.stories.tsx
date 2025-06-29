import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PreviewCard } from "./preview-card";

const meta = {
	title: "Components/Card/previewCard",
	component: PreviewCard,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof PreviewCard>;

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
		previewCardData: {
			href: "0011223344",
			title: "sample title",
			uint8ArrayImage,
		},
		basePath: "/example",
		imageType: "svg",
	},
};
