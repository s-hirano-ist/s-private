import { CardStack, CardStackData } from "@/components/stack/card-stack";

type Props = { cardStackData: CardStackData };

export function ContentsStackClient({ cardStackData }: Props) {
	return <CardStack data={cardStackData} showDeleteButton={false} />;
}
