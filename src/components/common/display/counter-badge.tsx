import { useTranslations } from "next-intl";
import { Badge } from "@/components/common/ui/badge";

type Props = { totalItems: number; label: string };

export function CounterBadge({ totalItems, label }: Props) {
	const t = useTranslations("label");

	return (
		<Badge className="flex justify-center w-full">
			{t(label)}: {totalItems}
		</Badge>
	);
}
