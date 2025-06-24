"use client";
import { useQuery } from "@tanstack/react-query";
import { ReactNode } from "react";
import Loading from "@/components/loading";
import { markdownToReact } from "@/features/viewer/utils/markdown-to-react";

type Props = { children?: ReactNode; markdown: string };

export function ViewerBody({ children, markdown }: Props) {
	const { data, isLoading } = useQuery({
		queryKey: ["viewerBody", markdown.slice(0, 10)],
		queryFn: async () => await markdownToReact(markdown),
		staleTime: Infinity,
		gcTime: 86_400_000 * 30, // 1 month
	});

	if (isLoading) return <Loading />;

	return (
		<div className="prose prose-sm mx-auto max-w-5xl px-4 py-2 dark:prose-invert space-y-8">
			{children}
			{data}
		</div>
	);
}
