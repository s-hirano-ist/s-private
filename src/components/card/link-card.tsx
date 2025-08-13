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
import { validateAndNormalizeUrl } from "@/utils/validate-url";

export type LinkCardData = {
	id: number | string;
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
	const { url: validatedHref, isExternal } = validateAndNormalizeUrl(href);

	const cardContent = (
		<Card className="relative hover:bg-secondary">
			{showDeleteButton && deleteAction !== undefined && (
				<DeleteButtonWithModal
					deleteAction={deleteAction}
					id={Number(id)} // FIXME: not safe when id is string
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
					{/* FIXME: break-words 必要? */}
					{description ?? "　"}
					{/* TODO: change to use fragment */}
					{/* <Fragment set:html={sanitizeHtml(d.quote ?? "")} /> */}
				</CardDescription>
			</CardContent>
		</Card>
	);

	if (isExternal) {
		return (
			<a href={validatedHref} rel="noopener noreferrer" target="_blank">
				{cardContent}
			</a>
		);
	}

	return <Link href={validatedHref}>{cardContent}</Link>;
}
