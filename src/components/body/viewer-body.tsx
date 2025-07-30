import { ReactNode } from "react";
import { getCachedMarkdownReact } from "@/features/viewer/utils/markdown-to-react";

type Props = { children?: ReactNode; markdown: string };

export async function ViewerBody({ children, markdown }: Props) {
	const content = await getCachedMarkdownReact(markdown);

	return (
		<div className="prose prose-sm mx-auto max-w-5xl px-4 py-2 dark:prose-invert space-y-8">
			{children}
			{content}
		</div>
	);
}
