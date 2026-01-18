import { CounterBadge } from "@/components/common/display/counter-badge";

export type Props = {
	count: number;
};

export function NotesCounter({ count }: Props) {
	return <CounterBadge label="totalNotes" totalItems={count} />;
}
