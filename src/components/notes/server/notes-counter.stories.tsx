import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Suspense } from "react";
import type { Props as NotesCounterProps } from "./notes-counter";
import { NotesCounter } from "./notes-counter";

function NotesCounterWrapper({ getNotesCount }: NotesCounterProps) {
	return (
		<Suspense>
			<NotesCounter getNotesCount={getNotesCount} />
		</Suspense>
	);
}

const meta = {
	component: NotesCounterWrapper,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
	argTypes: {
		getNotesCount: { action: "getNotesCount" },
	},
} satisfies Meta<typeof NotesCounterWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		getNotesCount: async () => 42,
	},
};

export const Empty: Story = {
	args: {
		getNotesCount: async () => 0,
	},
};

export const LargeCounts: Story = {
	args: {
		getNotesCount: async () => 1000,
	},
};
