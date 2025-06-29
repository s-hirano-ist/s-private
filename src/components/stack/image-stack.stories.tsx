import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";
import { ImageStack } from "./image-stack";

const meta = {
	title: "Components/Stack/ImageStack",
	component: ImageStack,
	tags: ["autodocs"],
} satisfies Meta<typeof ImageStack>;

export default meta;

type Story = StoryObj<typeof meta>;

const data = [
	{
		id: "https://picsum.photos/id/1/192/192",
		width: 192,
		height: 192,
	},
	{
		id: "https://picsum.photos/id/2/192/192",
		width: 192,
		height: 192,
	},
	{
		id: "https://picsum.photos/id/3/192/192",
		width: 192,
		height: 192,
	},
];

export const Default: Story = {
	args: { data },
	render: () => (
		<NextIntlClientProvider locale="ja">
			<ImageStack data={data} />
		</NextIntlClientProvider>
	),
};

export const NoData: Story = {
	args: { data: [] },
	render: () => (
		<NextIntlClientProvider
			locale="ja"
			messages={{ statusCode: { "204": "コンテンツがありません" } }}
		>
			<ImageStack data={[]} />
		</NextIntlClientProvider>
	),
};
