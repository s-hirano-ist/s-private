import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { sanitizeHref } from "@/utils/sanitize-href";
import Link from "next/link";

type Props = {
	id: number;
	title: string;
	quote: string | null;
	url: string;
	category?: string;
};

export function SmallCard({ id, title, quote, url, category }: Props) {
	return (
		<Link href={new URL(sanitizeHref(url))} target="_blank" scroll={false}>
			<Card className="hover:bg-secondary">
				<CardHeader>
					<div className="flex gap-4">
						<Badge>{id}</Badge>
						{category && <Badge variant="outline">{category}</Badge>}
					</div>
				</CardHeader>
				<CardContent>
					<CardTitle>{title}</CardTitle>
					<CardDescription className="truncate">
						{quote ? quote : "　"}
					</CardDescription>
				</CardContent>
			</Card>
		</Link>
	);
}
