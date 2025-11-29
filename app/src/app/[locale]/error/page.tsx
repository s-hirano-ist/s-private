import { StatusCodeView } from "@s-hirano-ist/s-ui/display/status/status-code-view";
import { Button } from "@s-hirano-ist/s-ui/ui/button";
import type { Route } from "next";
import { useTranslations } from "next-intl";
import { Link } from "@/infrastructures/i18n/routing";

// Auth0 Error page

export default function Page() {
	const t = useTranslations("statusCode");

	return (
		<main>
			<div className="flex h-screen w-screen flex-col items-center justify-center space-y-4 text-center">
				<StatusCodeView statusCode="500" statusCodeString={t("500")} />
				<Button asChild variant="outline">
					<Link href={"/" as Route}>Go back to Home</Link>
				</Button>
			</div>
		</main>
	);
}
