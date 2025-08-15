import { ReactNode } from "react";
import { markdownToReact } from "@/common/markdown/markdown-to-react";

type Props = { children?: ReactNode; markdown: string };

export async function ViewerBodyClient({ children, markdown }: Props) {
	const content = await markdownToReact(markdown);

	return (
		<div className="prose prose-sm mx-auto max-w-5xl px-4 py-2 dark:prose-invert space-y-8">
			{children}
			{content}
		</div>
	);
}
