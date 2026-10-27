import type { ReactNode } from "react";
import { ContentListPage } from "@/components/common/layouts/content-list-page";
import { ErrorBoundary } from "@/components/common/layouts/error-boundary";

type Section = {
	errorCaller: string;
	render: () => Promise<ReactNode>;
};

type Props = {
	counter?: Section;
	stack: Section;
};

export function renderContentListPage({ counter, stack }: Props) {
	return (
		<ContentListPage
			counter={
				counter && (
					<ErrorBoundary
						errorCaller={counter.errorCaller}
						fallback={<div />}
						render={counter.render}
					/>
				)
			}
			stack={
				<ErrorBoundary errorCaller={stack.errorCaller} render={stack.render} />
			}
		/>
	);
}
