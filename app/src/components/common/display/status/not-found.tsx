import { StatusCodeView } from "@s-hirano-ist/s-ui/display/status/status-code-view";
import { Button } from "@s-hirano-ist/s-ui/ui/button";
import Link from "next/link";

type NotFoundProps = {
	title: string;
	returnHomeText: string;
};

export function NotFound({ title, returnHomeText }: NotFoundProps) {
	return (
		<div className="flex flex-col items-center gap-6 py-8">
			<StatusCodeView statusCode="404" statusCodeString={title} />
			<Button asChild variant="outline">
				<Link href="/">{returnHomeText}</Link>
			</Button>
		</div>
	);
}
