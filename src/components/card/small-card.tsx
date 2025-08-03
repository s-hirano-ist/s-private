import { DeleteButtonWithModal } from "@/components/delete-button-with-modal";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { ServerAction } from "@/types";
import { validateUrl } from "@/utils/validate-url";

type Props = {
	category?: string;
	deleteAction?: (id: number) => Promise<ServerAction<number>>;
	id: number;
	quote: string | null;
	showDeleteButton: boolean;
	title: string;
	url: string;
};

export function SmallCard({
	id,
	deleteAction,
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
				{showDeleteButton && deleteAction !== undefined && (
					<DeleteButtonWithModal
						deleteAction={deleteAction}
						id={id}
						title={title}
					/>
				)}
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
