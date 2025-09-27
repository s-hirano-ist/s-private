import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Suspense } from "react";
import type { Props as BooksCounterProps } from "./books-counter";
import { BooksCounter } from "./books-counter";

function BooksCounterWrapper({ getBooksCount }: BooksCounterProps) {
	return (
		<Suspense>
			<BooksCounter getBooksCount={getBooksCount} />
		</Suspense>
	);
}

const meta = {
	component: BooksCounterWrapper,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
	argTypes: {
		getBooksCount: { action: "getBooksCount" },
	},
} satisfies Meta<typeof BooksCounterWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		getBooksCount: async () => 42,
	},
};

export const Empty: Story = {
	args: {
		getBooksCount: async () => 0,
	},
};

export const LargeCounts: Story = {
	args: {
		getBooksCount: async () => 1000,
	},
};
