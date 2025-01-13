"use client";
import { CardStackSkeleton } from "@/components/card/card-stack-skeleton";
import { SmallCard } from "@/components/card/small-card";
import { StatusCodeView } from "@/components/card/status-code-view";
import type { News } from "@/features/news/types";

type Props = {
	news: News[];
};

export function NewsStack({ news }: Props) {
	if (news === undefined) return <CardStackSkeleton />;
	if (news.length === 0) return <StatusCodeView statusCode="204" />;

	return (
		<div className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2 sm:gap-4 sm:p-4">
			{news.map((d) => {
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
