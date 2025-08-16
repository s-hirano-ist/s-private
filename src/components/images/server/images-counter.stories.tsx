import type { Meta, StoryObj } from "@storybook/react";
import { Suspense } from "react";
import { ImagesCounter } from "./images-counter";

type ImagesCounterWrapperProps = {
	currentPage: number;
	getImagesCount: () => Promise<{ count: number; pageSize: number }>;
};

function ImagesCounterWrapper({
	currentPage,
	getImagesCount,
}: ImagesCounterWrapperProps) {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<ImagesCounter
				currentPage={currentPage}
				getImagesCount={getImagesCount}
			/>
		</Suspense>
	);
}

const meta = {
	component: ImagesCounterWrapper,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
	argTypes: {
		currentPage: { control: { type: "number", min: 1 } },
		getImagesCount: { action: "getImagesCount" },
	},
} satisfies Meta<typeof ImagesCounterWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		currentPage: 1,
		getImagesCount: async () => ({
			count: 42,
			pageSize: 24,
		}),
	},
};

export const Empty: Story = {
	args: {
		currentPage: 1,
		getImagesCount: async () => ({
			count: 0,
			pageSize: 24,
		}),
	},
};

export const LargeCounts: Story = {
	args: {
		currentPage: 1,
		getImagesCount: async () => ({
			count: 1000,
			pageSize: 24,
		}),
	},
};

export const DifferentPage: Story = {
	args: {
		currentPage: 5,
		getImagesCount: async () => ({
			count: 120,
			pageSize: 24,
		}),
	},
};
