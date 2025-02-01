import type { ReactNode } from "react";

type Props = { children: ReactNode };

export function ViewerBody({ children }: Props) {
	return (
		<div className="prose prose-sm mx-auto max-w-5xl px-4 py-2 dark:prose-invert">
			{children}
		</div>
	);
}
