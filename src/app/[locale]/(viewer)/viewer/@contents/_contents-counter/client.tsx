import { CountBadge } from "@/components/count-badge";

type Props = {
	totalContents: number;
};

export function ContentsCounterClient({ totalContents }: Props) {
	return <CountBadge label="totalContents" total={totalContents} />;
}