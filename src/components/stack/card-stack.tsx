"use client";
import { SmallCard } from "@/components/card/small-card";
import { StatusCodeView } from "@/components/card/status-code-view";
import { CardStackSkeleton } from "@/components/stack/card-stack-skeleton";

type Props = {
	data: {
		id: number;
		title: string;
		quote: string | null;
		url: string;
		category?: string;
	}[];
};

export function CardStack({ data }: Props) {
	if (data === undefined) return <CardStackSkeleton />;
	if (data.length === 0) return <StatusCodeView statusCode="204" />;

	return (
		<div className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2 sm:gap-4 sm:p-4">
			{data.map((d) => {
				return (
					<SmallCard
						key={d.id}
						id={d.id}
						title={d.title}
						quote={d.quote}
						url={d.url}
						category={d.category}
					/>
				);
			})}
		</div>
	);
}
