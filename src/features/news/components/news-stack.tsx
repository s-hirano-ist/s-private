"use client";
import { StatusCodeView } from "@/components/card/status-code-view";
import { SmallCard } from "@/components/stack/small-card";
import { StackSkeleton } from "@/components/stack/stack-skeleton";
import type { News } from "@/features/news/types";

type Props = {
	news: News[];
};

export function NewsStack({ news }: Props) {
	if (news === undefined) return <StackSkeleton />;
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
