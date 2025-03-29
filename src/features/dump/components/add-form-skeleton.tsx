import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";

type Props = { showCategory?: boolean; showSubmitButton?: boolean };

export function AddFormSkeleton({
	showCategory = false,
	showSubmitButton = false,
}: Props) {
	const t = useTranslations("label");

	return (
		<div className="space-y-4">
			{showCategory && (
				<div className="space-y-1">
					<Label>{t("category")}</Label>
					<Skeleton className="h-9 " />
				</div>
			)}
			<div className="space-y-1">
				<Label>{t("title")}</Label>
				<Skeleton className="h-9 " />
			</div>
			<div className="space-y-1">
				<Label>{t("description")}</Label>
				<Skeleton className="h-[60px] " />
			</div>
			<div className="space-y-1">
				<Label>{t("url")}</Label>
				<Skeleton className="h-9 " />
			</div>
			{showSubmitButton && <Skeleton className="h-9 " />}
		</div>
	);
}
