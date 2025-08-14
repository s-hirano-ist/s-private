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
import { ServerAction } from "@/utils/types";
import { validateAndNormalizeUrl } from "@/utils/validate-url";

export type LinkCardData = {
	id: string;
	key: string;
	title: string;
	description?: string;
	badgeText?: string;
	href: string;
};

type Props = {
	data: LinkCardData;
	showDeleteButton: boolean;
	deleteAction?: (id: string) => Promise<ServerAction>;
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
