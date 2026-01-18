import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NoteForm } from "./note-form";

type NoteFormWrapperProps = {
	addNote: (
		formData: FormData,
	) => Promise<{ success: boolean; message: string }>;
};

function NoteFormWrapper({ addNote }: NoteFormWrapperProps) {
	return <NoteForm addNote={addNote} />;
}

const meta = {
	component: NoteFormWrapper,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
	argTypes: {
		addNote: { action: "addNote" },
	},
} satisfies Meta<typeof NoteFormWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		addNote: async () => ({
			success: true,
			message: "Note added successfully",
		}),
	},
};

export const ErrorOnSubmit: Story = {
	args: {
		addNote: async () => ({
			success: false,
			message: "Failed to add note",
		}),
	},
};
