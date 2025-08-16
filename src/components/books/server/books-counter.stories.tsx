import type { Meta, StoryObj } from "@storybook/react";
import { Suspense } from "react";
import { BooksCounter } from "./books-counter";

type BooksCounterWrapperProps = {
	currentPage: number;
	getBooksCount: () => Promise<{ count: number; pageSize: number }>;
};

function BooksCounterWrapper({
	currentPage,
	getBooksCount,
}: BooksCounterWrapperProps) {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<BooksCounter currentPage={currentPage} getBooksCount={getBooksCount} />
		</Suspense>
	);
}

const meta = {
	component: BooksCounterWrapper,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
	argTypes: {
		currentPage: { control: { type: "number", min: 1 } },
		getBooksCount: { action: "getBooksCount" },
	},
} satisfies Meta<typeof BooksCounterWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		currentPage: 1,
		getBooksCount: async () => ({
			count: 42,
			pageSize: 24,
		}),
	},
};

export const Empty: Story = {
	args: {
		currentPage: 1,
		getBooksCount: async () => ({
			count: 0,
			pageSize: 24,
		}),
	},
};

export const LargeCounts: Story = {
	args: {
		currentPage: 1,
		getBooksCount: async () => ({
			count: 1000,
			pageSize: 24,
		}),
	},
};

export const DifferentPage: Story = {
	args: {
		currentPage: 5,
		getBooksCount: async () => ({
			count: 120,
			pageSize: 24,
		}),
	},
};
