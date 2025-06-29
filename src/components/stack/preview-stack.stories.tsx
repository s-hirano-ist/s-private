import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";
import { PreviewStack } from "./preview-stack";

const meta = {
	title: "Components/Stack/PreviewStack",
	component: PreviewStack,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof PreviewStack>;

export default meta;

type Story = StoryObj<typeof meta>;

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <circle cx="50" cy="50" r="40" fill="blue" />
</svg>`;
const encoder = new TextEncoder();
const uint8ArrayImage = encoder.encode(svg);

const previewCardData = [
	{
		isbn: "1111111111",
		href: "/example/1111111111",
		title: "sample title 1",
		uint8ArrayImage,
	},
	{
		isbn: "2222222222",
		href: "/example/2222222222",
		title: "sample title 2",
		uint8ArrayImage,
	},
	{
		isbn: "3333333333",
		href: "/example/3333333333",
		title: "sample title 3",
		uint8ArrayImage,
	},
	{
		isbn: "4444444444",
		href: "/example/4444444444",
		title: "sample title 4",
		uint8ArrayImage,
	},
	{
		isbn: "5555555555",
		href: "/example/5555555555",
		title: "sample title 5",
		uint8ArrayImage,
	},
	{
		isbn: "6666666666",
		href: "/example/6666666666",
		title: "sample title 6",
		uint8ArrayImage,
	},
];
const path = "/example";
const imageType = "svg";

export const Default: Story = {
	args: {
		previewCardData,
		basePath: path,
		imageType,
	},
	render: (args) => (
		<NextIntlClientProvider
			locale="ja"
			messages={{ label: { search: "検索" } }}
		>
			<PreviewStack
				basePath={args.basePath}
				imageType={imageType}
				previewCardData={args.previewCardData}
			/>
		</NextIntlClientProvider>
	),
};
