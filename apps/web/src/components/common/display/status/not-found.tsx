import type { Route } from "next";
import { StatusCodeView } from "@/components/common/display/status/status-code-view";
import { buttonVariants } from "@s-hirano-ist/s-ui/button";
import Link from "next/link";

type NotFoundProps<ReturnHomeHref extends string> = {
	returnHomeHref: Route<ReturnHomeHref>;
	returnHomeText: string;
	title: string;
};

export function NotFound<ReturnHomeHref extends string>({
	title,
	returnHomeText,
	returnHomeHref,
}: NotFoundProps<ReturnHomeHref>) {
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
