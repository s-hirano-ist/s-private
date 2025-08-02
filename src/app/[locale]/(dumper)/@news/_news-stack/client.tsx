import { CardStack, CardStackData } from "@/components/stack/card-stack";
import { ServerAction } from "@/types";

type Props = {
	cardStackData: CardStackData;
	deleteNews: (id: number) => Promise<ServerAction<number>>;
};

export function NewsStackClient({ cardStackData, deleteNews }: Props) {
	return (
		<CardStack
			data={cardStackData}
			deleteAction={deleteNews}
			showDeleteButton
		/>
	);
}
