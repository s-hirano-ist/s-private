import "server-only";

import { getExportedNotesCount } from "@/application-services/notes/get-notes";
import { NotesCounter } from "@/components/notes/server/notes-counter";
import type { CounterLoaderProps } from "@/loaders/types";

export type NotesCounterLoaderProps = CounterLoaderProps;

export async function NotesCounterLoader(_props: NotesCounterLoaderProps) {
	const count = await getExportedNotesCount();

	return <NotesCounter count={count} />;
}
