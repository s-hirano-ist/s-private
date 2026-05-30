import "server-only";
import type { ServerAction } from "@/common/types";
import type { BaseLoaderProps } from "@/loaders/types";
import { NoteForm } from "@/components/notes/client/note-form";

export type NoteFormLoaderProps = BaseLoaderProps & {
	addNote: (formData: FormData) => Promise<ServerAction>;
};

export async function NoteFormLoader({ addNote }: NoteFormLoaderProps) {
	return <NoteForm addNote={addNote} />;
}
