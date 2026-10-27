import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Image from "next/image";
import { expect } from "storybook/test";

const meta = {
	title: "Brand/App icon",
	parameters: { layout: "centered" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const IconSizes: Story = {
	render: () => (
		<div className="flex items-end gap-6">
			{[180, 48, 32].map((size) => (
				<figure className="flex flex-col items-center gap-2" key={size}>
					<Image
						alt={`Memdex app icon at ${size} pixels`}
						height={size}
						src="/icons/icon-512.png"
						width={size}
					/>
					<figcaption>{size} px</figcaption>
				</figure>
			))}
		</div>
	),
	play: async ({ canvas }) => {
		await expect(canvas.getAllByRole("img")).toHaveLength(3);
	},
};
