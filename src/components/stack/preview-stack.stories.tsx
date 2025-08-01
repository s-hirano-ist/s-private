import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";
import { PreviewStackClient } from "./preview-stack";

const meta = {
	title: "Components/Stack/PreviewStack",
	component: PreviewStackClient,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof PreviewStackClient>;

export default meta;

type Story = StoryObj<typeof meta>;

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <circle cx="50" cy="50" r="40" fill="blue" />
</svg>`;
const encoder = new TextEncoder();
const image = encoder.encode(svg);

const previewCardData = [
	{
		isbn: "1111111111",
		href: "/example/1111111111",
		title: "sample title 1",
		image,
	},
	{
		isbn: "2222222222",
		href: "/example/2222222222",
		title: "sample title 2",
		image,
	},
	{
		isbn: "3333333333",
		href: "/example/3333333333",
		title: "sample title 3",
		image,
	},
	{
		isbn: "4444444444",
		href: "/example/4444444444",
		title: "sample title 4",
		image,
	},
	{
		isbn: "5555555555",
		href: "/example/5555555555",
		title: "sample title 5",
		image,
	},
	{
		isbn: "6666666666",
		href: "/example/6666666666",
		title: "sample title 6",
		image,
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
			<PreviewStackClient
				basePath={args.basePath}
				imageType={imageType}
				previewCardData={args.previewCardData}
			/>
		</NextIntlClientProvider>
	),
};
