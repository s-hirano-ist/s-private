import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { NoteFormClient } from "./note-form-client";

const meta = {
	component: NoteFormClient,
	parameters: { layout: "centered" },
	tags: ["autodocs"],
} satisfies Meta<typeof NoteFormClient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { addNote: fn() } };
