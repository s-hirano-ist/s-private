"use client";
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

export type LinkCardData = {
	id: number;
	title: string;
	description?: string;
	badgeText?: string;
	href: string;
};

type Props = {
	data: LinkCardData;
	showDeleteButton: boolean;
	deleteAction?: (id: number) => Promise<ServerAction<number>>;
};

export function LinkCard({
	data: { id, title, description, badgeText, href },
	showDeleteButton,
	deleteAction,
}: Props) {
	// FIXME: TODO:
	// const validatedHref = new URL(validateUrl(href));
	const validatedHref = href;
	return (
		<Link href={validatedHref} target="_blank">
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
						{badgeText && <Badge variant="outline">{badgeText}</Badge>}
					</div>
				</CardHeader>
				<CardContent>
					<CardTitle>{title}</CardTitle>
					<CardDescription className="truncate">
						{description ?? "　"}
					</CardDescription>
				</CardContent>
			</Card>
		</Link>
	);
}
