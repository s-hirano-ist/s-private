import { LoadingIndicator } from "@s-hirano-ist/s-ui/loading-indicator";
import { useTranslations } from "next-intl";

export function RssLoading({ label }: { label?: string }) {
	const t = useTranslations("rss");
	return <LoadingIndicator label={label ?? t("loading")} />;
}
