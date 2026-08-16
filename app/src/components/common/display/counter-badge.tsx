import { Badge } from "@s-hirano-ist/s-ui/ui/badge";
import { useTranslations } from "next-intl";

type Props = { label: string; totalItems: number };

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
