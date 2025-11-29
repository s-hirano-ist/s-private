import type { Route } from "next";
import Link from "next/link";
import { Button } from "s-ui/ui/button";

type NotFoundProps = {
	title: string;
	returnHomeText: string;
};

export function NotFound({ title, returnHomeText }: NotFoundProps) {
	return (
		<div className="space-y-2">
			<div
				className="w-full bg-linear-to-r from-primary to-primary-grad bg-clip-text p-2 text-center font-extrabold text-transparent"
				data-testid="status-code-view"
			>
				<div className="text-9xl">
					<span className="hidden font-light sm:inline">---</span>
					404
					<span className="hidden font-light sm:inline">---</span>
				</div>
				<div className="text-sm">------{title}------</div>
			</div>
			<Button asChild className="mx-auto flex w-1/2 flex-col">
				<Link href={"/" as Route}>{returnHomeText}</Link>
			</Button>
		</div>
	);
}
