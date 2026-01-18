import type { ServerAction } from "@/common/types";
import { NoteFormClient } from "../client/note-form-client";

type Props = {
	addNote: (formData: FormData) => Promise<ServerAction>;
};

export function NoteForm({ addNote }: Props) {
	return <NoteFormClient addNote={addNote} />;
}
