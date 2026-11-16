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
	if (display === "inline") {
		if (!label) return null;
		return (
			<output
				aria-label={label}
				aria-live="polite"
				className="inline-flex items-center"
			>
				<span
					aria-hidden="true"
					className="inline-flex animate-spin motion-reduce:animate-none"
				>
					<LoaderCircle className="size-4" />
				</span>
			</output>
		);
	}
	return <LoadingIndicator label={label ?? t("loading")} />;
}
