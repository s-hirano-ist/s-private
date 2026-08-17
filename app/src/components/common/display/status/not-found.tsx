import type { Route } from "next";
import { StatusCodeView } from "@/components/common/display/status/status-code-view";
import { buttonVariants } from "@s-hirano-ist/s-ui/button";
import Link from "next/link";

type NotFoundProps = {
	returnHomeHref: Route;
	returnHomeText: string;
	title: string;
};

export function NotFound({
	title,
	returnHomeText,
	returnHomeHref,
}: NotFoundProps) {
	return (
		<div className="flex flex-col items-center gap-6 py-8">
			<StatusCodeView statusCode="404" statusCodeString={title} />
			<Link
				className={buttonVariants({ variant: "outline" })}
				href={returnHomeHref}
			>
				{returnHomeText}
			</Link>
		</div>
	);
}
