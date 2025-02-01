import { StatusCodeView } from "@/components/card/status-code-view";
import { Button } from "@/components/ui/button";
import { Route } from "next";
import { Link } from "next-view-transitions";

export const runtime = "edge";

// Auth0 Error page
export default function Page() {
	return (
		<main>
			<div className="flex h-screen w-screen flex-col items-center justify-center space-y-4 text-center">
				<StatusCodeView statusCode="500" />
				<Button variant="outline" asChild>
					<Link href={"/" as Route}>Go back to Home</Link>
				</Button>
			</div>
		</main>
	);
}
