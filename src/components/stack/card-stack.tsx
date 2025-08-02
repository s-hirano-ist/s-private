"use client";
import { SmallCard } from "@/components/card/small-card";
import { StatusCodeView } from "@/components/card/status-code-view";
import { CardStackSkeleton } from "@/components/stack/card-stack-skeleton";
import { ServerAction } from "@/types";

export type CardStackData = {
	category?: string;
	id: number;
	quote: string | null;
	title: string;
	url: string;
}[];

type Props = {
	data: CardStackData;
	deleteAction?: (id: number) => Promise<ServerAction<number>>;
	showDeleteButton: boolean;
};

export function CardStack({ data, showDeleteButton, deleteAction }: Props) {
	if (data === undefined) return <CardStackSkeleton />;
	if (data.length === 0) return <StatusCodeView statusCode="204" />;

	return (
		<div className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2 sm:gap-4 sm:p-4">
			{data.map((d) => {
				return (
					<SmallCard
						category={d.category}
						deleteAction={deleteAction}
						id={d.id}
						key={d.id}
						quote={d.quote}
						showDeleteButton={showDeleteButton}
						title={d.title}
						url={d.url}
					/>
				);
			})}
		</div>
	);
}
