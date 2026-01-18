import "server-only";

import type { ServerAction } from "@/common/types";
import { NoteFormClient } from "@/components/notes/client/note-form-client";
import type { BaseLoaderProps } from "@/loaders/types";

export type NoteFormLoaderProps = BaseLoaderProps & {
	addNote: (formData: FormData) => Promise<ServerAction>;
};

export async function NoteFormLoader({ addNote }: NoteFormLoaderProps) {
	return <NoteFormClient addNote={addNote} />;
}
