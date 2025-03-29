"use client";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

type Properties = { label: string; total: number };

export function CountBadge({ label, total }: Properties) {
	const t = useTranslations("label");
	return (
		<Badge className="m-2 flex justify-center">
			{t(label)}: {total}
		</Badge>
	);
}
