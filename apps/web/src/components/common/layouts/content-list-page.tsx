import type { ReactNode } from "react";
import { LoadingIndicator as Loading } from "@s-hirano-ist/s-ui/loading-indicator";
import { Suspense } from "react";

type Props = {
	counter?: ReactNode;
	stack: ReactNode;
};

export function ContentListPage({ counter, stack }: Props) {
	return (
		<>
			{counter && <Suspense fallback={null}>{counter}</Suspense>}
			<Suspense fallback={<Loading />}>{stack}</Suspense>
		</>
	);
}
