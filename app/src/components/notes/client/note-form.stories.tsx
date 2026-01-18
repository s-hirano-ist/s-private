import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { NoteForm } from "./note-form";

const meta = {
	component: NoteForm,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof NoteForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { addNote: fn() } };
