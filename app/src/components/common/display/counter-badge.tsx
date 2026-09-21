import { Badge } from "@s-hirano-ist/s-ui/badge";
import { useTranslations } from "next-intl";

type Props = { label: string; totalItems: number };

export function CounterBadge({ totalItems, label }: Props) {
	const t = useTranslations("label");

	return (
		<div className="p-2">
			<Badge className="flex w-full justify-center">
				{t(label)}: {totalItems}
			</Badge>
		</div>
	);
}

export function CounterBadgeSkeleton() {
	return (
		<div className="p-2">
			<Badge
				aria-hidden="true"
				className="flex w-full animate-pulse justify-center border-transparent bg-muted hover:bg-muted"
			>
				<span className="invisible">loading</span>
			</Badge>
		</div>
	);
}
