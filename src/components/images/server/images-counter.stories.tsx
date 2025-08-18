import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Suspense } from "react";
import {
	type Props as ImageCounterProps,
	ImagesCounter,
} from "./images-counter";

function ImagesCounterWrapper({ getImagesCount }: ImageCounterProps) {
	return (
		<Suspense>
			<ImagesCounter getImagesCount={getImagesCount} />
		</Suspense>
	);
}

const meta = {
	component: ImagesCounterWrapper,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
	argTypes: {
		getImagesCount: { action: "getImagesCount" },
	},
} satisfies Meta<typeof ImagesCounterWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
	args: {
		getImagesCount: async () => 42,
	},
};

export const Empty: Story = {
	args: {
		getImagesCount: async () => 0,
	},
};

export const LargeCounts: Story = {
	args: {
		getImagesCount: async () => 1000,
	},
};
