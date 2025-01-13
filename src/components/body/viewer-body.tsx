import type { ReactNode } from "react";

type Props = {
	children: ReactNode;
};

export function ViewerBody({ children }: Props) {
	return (
		<div className="prose prose-sm mx-auto p-2 sm:prose-base">{children}</div>
	);
}
