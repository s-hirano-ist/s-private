"use client";
import { memo, useMemo } from "react";
import { SmallCard } from "@/components/card/small-card";
import { StatusCodeView } from "@/components/card/status-code-view";
import { CardStackSkeleton } from "@/components/stack/card-stack-skeleton";
import { ServerAction } from "@/types";

type CardData = {
	category?: string;
	id: number;
	quote: string | null;
	title: string;
	url: string;
};

type Props = {
	data: CardData[];
	deleteAction?: (id: number) => Promise<ServerAction<number>>;
	showDeleteButton: boolean;
};

const CardStackComponent = function CardStack({
	data,
	showDeleteButton,
	deleteAction,
}: Props) {
	const cardElements = useMemo(() => {
		return data?.map((d) => (
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
		));
	}, [data, showDeleteButton, deleteAction]);

	if (data === undefined) return <CardStackSkeleton />;
	if (data.length === 0) return <StatusCodeView statusCode="204" />;

	return (
		<div className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2 sm:gap-4 sm:p-4">
			{cardElements}
		</div>
	);
};

export const CardStack = memo(CardStackComponent);
