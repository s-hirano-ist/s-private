"use client";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

type Props = { label: string; total: number };

export const CountBadge = ({ label, total }: Props) => {
	const t = useTranslations("label");
	return (
		<Badge className="m-2 flex justify-center">
			{t(label)}: {total}
		</Badge>
	);
};
