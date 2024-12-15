"use client";
import { SmallCard } from "@/components/stack/small-card";
import { StackSkeleton } from "@/components/stack/stack-skeleton";
import { StatusCodeView } from "@/components/status-code-view";
import type { ContentsAtom } from "@/features/contents/stores/contents-atom";

type Props = {
	contents: ContentsAtom[];
};

export function ContentsStack({ contents }: Props) {
	if (contents === undefined) return <StackSkeleton />;
	if (contents.length === 0) return <StatusCodeView statusCode="204" />;

	return (
		<div className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2 sm:gap-4 sm:p-4">
			{contents.map((d) => {
				return (
					<SmallCard
						key={d.id}
						id={d.id}
						title={d.title}
						quote={d.quote}
						url={d.url}
					/>
				);
			})}
		</div>
	);
}
