import { unstable_cache } from "next/cache";
import { ReactNode } from "react";
import { markdownToReact } from "@/features/viewer/utils/markdown-to-react";

type Props = { children?: ReactNode; markdown: string };

export async function ViewerBodyClient({ children, markdown }: Props) {
	const content = unstable_cache(
		async (markdown: string) => markdownToReact(markdown),
		[`markdown-react-${Buffer.from(markdown).toString("base64").slice(0, 32)}`],
		{
			revalidate: 86_400 * 30, // 30 days
			tags: ["markdown"],
		},
	)(markdown);

	return (
		<div className="prose prose-sm mx-auto max-w-5xl px-4 py-2 dark:prose-invert space-y-8">
			{children}
			{content}
		</div>
	);
}
