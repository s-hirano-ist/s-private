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

type Properties = {
	category?: string;
	id: number;
	quote: string | null;
	title: string;
	url: string;
};

export function SmallCard({ id, title, quote, url, category }: Properties) {
	const validatedUrl = new URL(validateUrl(url));

	return (
		<Link data-testid={`small-card-${id}`} href={validatedUrl} target="_blank">
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
						{quote ?? "　"}
					</CardDescription>
				</CardContent>
			</Card>
		</Link>
	);
}
