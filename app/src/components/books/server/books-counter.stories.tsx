import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { Props as BooksCounterProps } from "./books-counter";
import { BooksCounter } from "./books-counter";

function BooksCounterWrapper({ count }: BooksCounterProps) {
	return <BooksCounter count={count} />;
}

const meta = {
	component: BooksCounterWrapper,
	parameters: { layout: "centered" },
	argTypes: {
		count: { control: "number" },
	},
} satisfies Meta<typeof BooksCounterWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		count: 42,
	},
};

export const Empty: Story = {
	args: {
		count: 0,
	},
};

export const LargeCounts: Story = {
	args: {
		count: 1000,
	},
};
