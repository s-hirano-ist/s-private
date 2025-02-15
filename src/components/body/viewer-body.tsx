"use client";
import { markdownToReact } from "@/features/viewer/utils/markdown-to-react";
import { use } from "react";

type Props = { markdown: string };

export function ViewerBody({ markdown }: Props) {
	const data = use(markdownToReact(markdown));
	return (
		<div className="prose prose-sm mx-auto max-w-5xl px-4 py-2 dark:prose-invert">
			{data}
		</div>
	);
}
