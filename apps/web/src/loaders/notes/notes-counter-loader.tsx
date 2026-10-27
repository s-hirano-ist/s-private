import "server-only";
import type { CounterLoaderProps } from "@/loaders/types";
import { getExportedNotesCount } from "@/application-services/notes/get-notes";
import { ViewerCountSync } from "@/components/common/layouts/nav/viewer-count-context";

export type NotesCounterLoaderProps = CounterLoaderProps;

export async function NotesCounterLoader(_props: NotesCounterLoaderProps) {
	const count = await getExportedNotesCount();

	return <ViewerCountSync count={count} domain="notes" />;
}
