import { Link } from "next-view-transitions";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { DeleteNewsButton } from "@/features/news/components/delete-news-button";
import { validateUrl } from "@/utils/validate-url";

type Props = {
	category?: string;
	id: number;
	quote: string | null;
	showDeleteButton: boolean;
	title: string;
	url: string;
};

export function SmallCard({
	id,
	title,
	quote,
	url,
	category,
	showDeleteButton,
}: Props) {
	const validatedUrl = new URL(validateUrl(url));

	return (
		<Link data-testid={`small-card-${id}`} href={validatedUrl} target="_blank">
			<Card className="relative hover:bg-secondary">
				{showDeleteButton && <DeleteNewsButton id={id} title={title} />}
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
