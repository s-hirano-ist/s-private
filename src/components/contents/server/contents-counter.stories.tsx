import type { Meta, StoryObj } from "@storybook/react";
import { Suspense } from "react";
import { ContentsCounter } from "./contents-counter";

type ContentsCounterWrapperProps = {
	currentPage: number;
	getContentsCount: () => Promise<{ count: number; pageSize: number }>;
};

function ContentsCounterWrapper({
	currentPage,
	getContentsCount,
}: ContentsCounterWrapperProps) {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<ContentsCounter
				currentPage={currentPage}
				getContentsCount={getContentsCount}
			/>
		</Suspense>
	);
}

const meta = {
	component: ContentsCounterWrapper,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
	argTypes: {
		currentPage: { control: { type: "number", min: 1 } },
		getContentsCount: { action: "getContentsCount" },
	},
} satisfies Meta<typeof ContentsCounterWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		currentPage: 1,
		getContentsCount: async () => ({
			count: 42,
			pageSize: 24,
		}),
	},
};

export const Empty: Story = {
	args: {
		currentPage: 1,
		getContentsCount: async () => ({
			count: 0,
			pageSize: 24,
		}),
	},
};

export const LargeCounts: Story = {
	args: {
		currentPage: 1,
		getContentsCount: async () => ({
			count: 1000,
			pageSize: 24,
		}),
	},
};

export const DifferentPage: Story = {
	args: {
		currentPage: 5,
		getContentsCount: async () => ({
			count: 120,
			pageSize: 24,
		}),
	},
};
