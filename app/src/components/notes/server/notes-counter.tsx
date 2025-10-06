import type { GetCount } from "@/common/types";
import { CounterBadge } from "@/components/common/display/counter-badge";

export type Props = {
	getNotesCount: GetCount;
};

export async function NotesCounter({ getNotesCount }: Props) {
	const totalNotes = await getNotesCount();

	return <CounterBadge label="totalNotes" totalItems={totalNotes} />;
}
