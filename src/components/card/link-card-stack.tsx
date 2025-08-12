"use client";
import { LinkCard, LinkCardData } from "@/components/card/link-card";
import { LinkCardSkeletonStack } from "@/components/card/link-card-skeleton-stack";
import { StatusCodeView } from "@/components/status/status-code-view";
import { ServerAction } from "@/types";

type Props = {
	data: LinkCardData[];
	showDeleteButton: boolean;
	deleteAction?: (id: number) => Promise<ServerAction<number>>;
};

export function LinkCardStack({ data, showDeleteButton, deleteAction }: Props) {
	if (data === undefined) return <LinkCardSkeletonStack />;
	if (data.length === 0) return <StatusCodeView statusCode="204" />;

	return (
		<div className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2 sm:gap-4 sm:p-4">
			{data.map((d) => {
				return (
					<LinkCard
						data={d}
						deleteAction={deleteAction}
						key={d.id}
						showDeleteButton={showDeleteButton}
					/>
				);
			})}
		</div>
	);
}
