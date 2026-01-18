import "server-only";

import type { ServerAction } from "@/common/types";
import { NoteForm } from "@/components/notes/server/note-form";
import type { BaseLoaderProps } from "@/loaders/types";

export type NoteFormLoaderProps = BaseLoaderProps & {
	addNote: (formData: FormData) => Promise<ServerAction>;
};

export async function NoteFormLoader({ addNote }: NoteFormLoaderProps) {
	return <NoteForm addNote={addNote} />;
}
