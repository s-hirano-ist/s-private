import { Route } from "next";
import Link from "next/link";
import { StatusCodeView } from "@/components/card/status-code-view";
import { Button } from "@/components/ui/button";

// Auth0 Error page

export default function Page() {
	return (
		<main>
			<div className="flex h-screen w-screen flex-col items-center justify-center space-y-4 text-center">
				<StatusCodeView statusCode="500" />
				<Button asChild variant="outline">
					<Link href={"/" as Route}>Go back to Home</Link>
				</Button>
			</div>
		</main>
	);
}
