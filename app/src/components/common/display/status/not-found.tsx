import type { Route } from "next";
import { StatusCodeView } from "@s-hirano-ist/s-ui/display/status/status-code-view";
import { Button } from "@s-hirano-ist/s-ui/ui/button";
import Link from "next/link";

type NotFoundProps = {
	title: string;
	returnHomeText: string;
	returnHomeHref: Route;
};

export function NotFound({
	title,
	returnHomeText,
	returnHomeHref,
}: NotFoundProps) {
	return (
		<div className="flex flex-col items-center gap-6 py-8">
			<StatusCodeView statusCode="404" statusCodeString={title} />
			<Button asChild variant="outline">
				<Link href={returnHomeHref}>{returnHomeText}</Link>
			</Button>
		</div>
	);
}
