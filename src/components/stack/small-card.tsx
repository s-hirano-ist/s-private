import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { validateUrl } from "@/utils/validate-url";
import { Link } from "next-view-transitions";

type Props = {
	id: number;
	title: string;
	quote: string | null;
	url: string;
	category?: string;
};

export function SmallCard({ id, title, quote, url, category }: Props) {
	return (
		<Link
			href={new URL(validateUrl(url))}
			target="_blank"
			data-testid={`small-card-${id}`}
		>
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
