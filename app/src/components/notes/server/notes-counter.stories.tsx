import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { Props as NotesCounterProps } from "./notes-counter";
import { NotesCounter } from "./notes-counter";

function NotesCounterWrapper({ count }: NotesCounterProps) {
	return <NotesCounter count={count} />;
}

const meta = {
	component: NotesCounterWrapper,
	parameters: { layout: "centered" },
	argTypes: {
		count: { control: "number" },
	},
} satisfies Meta<typeof NotesCounterWrapper>;

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
