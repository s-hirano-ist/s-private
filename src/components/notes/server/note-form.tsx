import type { ServerAction } from "@/common/types";
import { NoteFormClient } from "../client/note-form-client";

type Props = {
	addNote: (formData: FormData) => Promise<ServerAction>;
};

export async function NoteForm({ addNote }: Props) {
	return <NoteFormClient addNote={addNote} />;
}
