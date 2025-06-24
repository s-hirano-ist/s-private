"use client";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

type Props = { label: string; total: number };

export function CountBadge({ label, total }: Props) {
	const t = useTranslations("label");
	return (
		<Badge className="m-2 flex justify-center">
			{t(label)}: {total}
		</Badge>
	);
}
