import { useTranslations } from "next-intl";
import { Badge } from "@/components/common/ui/badge";

type Props = { totalItems: number; label: string };

export function CounterBadge({ totalItems, label }: Props) {
	const t = useTranslations("label");

	return (
		<div className="px-1">
			<Badge className="flex w-full justify-center">
				{t(label)}: {totalItems}
			</Badge>
		</div>
	);
}
