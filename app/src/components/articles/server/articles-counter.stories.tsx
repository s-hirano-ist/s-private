import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { Props as ArticlesCounterProps } from "./articles-counter";
import { ArticlesCounter } from "./articles-counter";

function ArticlesCounterWrapper({ count }: ArticlesCounterProps) {
	return <ArticlesCounter count={count} />;
}

const meta = {
	component: ArticlesCounterWrapper,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
	argTypes: {
		count: { control: "number" },
	},
} satisfies Meta<typeof ArticlesCounterWrapper>;

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
