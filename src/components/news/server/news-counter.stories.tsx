import type { Meta, StoryObj } from "@storybook/react";
import { Suspense } from "react";
import { NewsCounter } from "./news-counter";

type NewsCounterWrapperProps = {
	currentPage: number;
	getNewsCount: () => Promise<{ count: number; pageSize: number }>;
};

function NewsCounterWrapper({
	currentPage,
	getNewsCount,
}: NewsCounterWrapperProps) {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<NewsCounter currentPage={currentPage} getNewsCount={getNewsCount} />
		</Suspense>
	);
}

const meta = {
	component: NewsCounterWrapper,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
	argTypes: {
		currentPage: { control: { type: "number", min: 1 } },
		getNewsCount: { action: "getNewsCount" },
	},
} satisfies Meta<typeof NewsCounterWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		currentPage: 1,
		getNewsCount: async () => ({
			count: 42,
			pageSize: 24,
		}),
	},
};

export const Empty: Story = {
	args: {
		currentPage: 1,
		getNewsCount: async () => ({
			count: 0,
			pageSize: 24,
		}),
	},
};

export const LargeCounts: Story = {
	args: {
		currentPage: 1,
		getNewsCount: async () => ({
			count: 1000,
			pageSize: 24,
		}),
	},
};

export const DifferentPage: Story = {
	args: {
		currentPage: 5,
		getNewsCount: async () => ({
			count: 120,
			pageSize: 24,
		}),
	},
};
