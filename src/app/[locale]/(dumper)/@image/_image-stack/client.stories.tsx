import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";
import { ImageStackClient } from "./client";

const meta = {
	component: ImageStackClient,
	parameters: {
		layout: "centered",
	},
	decorators: [
		(Story) => (
			<NextIntlClientProvider
				locale="en"
				messages={{
					label: {
						title: "Title",
						description: "Description",
						url: "URL",
						save: "Save",
					},
					message: {
						success: "Content added successfully",
						error: "Failed to add content",
					},
				}}
			>
				<div className="w-96">
					<Story />
				</div>
			</NextIntlClientProvider>
		),
	],
	tags: ["autodocs"],
} satisfies Meta<typeof ImageStackClient>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockData = [
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
	args: { images: mockData },
};
