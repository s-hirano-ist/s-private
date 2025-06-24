import type { Route } from "next";
import { Link } from "next-view-transitions";
import { Button } from "@/components/ui/button";

export function NotFound() {
	return (
		<div className="space-y-2">
			<div
				className="w-full bg-linear-to-r from-primary-grad-from to-primary-grad-to bg-clip-text p-2 text-center font-extrabold text-transparent"
				data-testid="status-code-view"
			>
				<div className="text-9xl">
					<span className="hidden font-light sm:inline">---</span>
					404
					<span className="hidden font-light sm:inline">---</span>
				</div>
				<div className="text-sm">------Not Found------</div>
			</div>
			<p className="px-4 text-center text-primary-grad">
				The content you are looking for could not be found.
			</p>
			<Button asChild className="mx-auto flex w-1/2 flex-col">
				<Link href={"/" as Route}>Return to Home</Link>
			</Button>
		</div>
	);
}
