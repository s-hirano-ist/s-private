"use client";
import Loading from "@/components/loading";
import { markdownToReact } from "@/features/viewer/utils/markdown-to-react";
import { useQuery } from "@tanstack/react-query";

type Props = { markdown: string };

export function ViewerBody({ markdown }: Props) {
	const { data, isLoading } = useQuery({
		queryKey: ["viewerBody", markdown.slice(10)],
		queryFn: async () => await markdownToReact(markdown),
	});

	if (isLoading) return <Loading />;

	return (
		<div className="prose prose-sm mx-auto max-w-5xl px-4 py-2 dark:prose-invert">
			{data}
		</div>
	);
}
