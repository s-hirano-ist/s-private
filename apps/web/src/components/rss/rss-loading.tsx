import { LoadingIndicator } from "@s-hirano-ist/s-ui/loading-indicator";
import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export function RssLoading({
	display = "page",
	label,
}: {
	display?: "inline" | "page";
	label?: string;
}) {
	const t = useTranslations("rss");
	if (display === "inline")
		return (
			<output aria-live="polite" className="flex min-h-6 items-center gap-2">
				{label ? (
					<>
						<span
							aria-hidden="true"
							className="inline-flex size-4 shrink-0 animate-spin motion-reduce:animate-none [&>svg]:size-full"
						>
							<LoaderCircle />
						</span>
						{label}
					</>
				) : null}
			</output>
		);
	return (
		<div className="py-8 text-center text-muted-foreground">
			<div aria-hidden="true">
				<LoadingIndicator />
			</div>
			<output className="block">{label ?? t("loading")}</output>
		</div>
	);
}
