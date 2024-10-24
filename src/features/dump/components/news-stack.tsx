"use client";
import { SmallCard } from "@/components/stack/small-card";
import { StackSkeleton } from "@/components/stack/stack-skeleton";
import { StatusCodeView } from "@/components/status-code-view";
import { newsContext } from "@/features/dump/stores/news-context";
import type { NewsContext } from "@/features/dump/stores/news-context";
import { useEffect } from "react";
import { useRecoilState } from "recoil";

type Props = {
	news: NewsContext[];
};

export function NewsStack({ news }: Props) {
	const [data, setData] = useRecoilState(newsContext);

	useEffect(() => {
		setData(news);
	}, [news, setData]);

	if (data === undefined) return <StackSkeleton />;
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
