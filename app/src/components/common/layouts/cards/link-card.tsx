"use client";
import { Badge } from "@s-hirano-ist/s-ui/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@s-hirano-ist/s-ui/ui/card";
import ReactMarkdown from "react-markdown";
import type { DeleteAction } from "@/common/types";
import { DeleteButtonWithModal } from "@/components/common/forms/actions/delete-button-with-modal";
import { validateAndNormalizeUrl } from "@/components/common/utils/validate-url";
import { Link } from "@/infrastructures/i18n/routing";
import type { LinkCardData } from "./types";

type Props = {
	data: LinkCardData;
	showDeleteButton: boolean;
	deleteAction?: DeleteAction;
};

export function LinkCard({
	data: { id, title, description, primaryBadgeText, secondaryBadgeText, href },
	showDeleteButton,
	deleteAction,
}: Props) {
	const { url: validatedHref, isExternal } = validateAndNormalizeUrl(href);

	const CardComponent = isExternal ? "a" : Link;
	const linkProps = isExternal
		? { href: validatedHref, rel: "noopener noreferrer", target: "_blank" }
		: { href: validatedHref };

	return (
		<div className="relative h-full">
			<CardComponent {...linkProps} className="block h-full">
				<Card className="flex h-full flex-col hover:bg-muted">
					<CardHeader>
						<div className="flex gap-4">
							{primaryBadgeText && <Badge>{primaryBadgeText}</Badge>}
							{secondaryBadgeText && (
								<Badge variant="outline">{secondaryBadgeText}</Badge>
							)}
						</div>
					</CardHeader>
					<CardContent className="flex-grow">
						<CardTitle>{title}</CardTitle>
						<CardDescription className="break-words">
							{description ? (
								<ReactMarkdown>{description}</ReactMarkdown>
							) : (
								"　"
							)}
						</CardDescription>
					</CardContent>
				</Card>
			</CardComponent>
			{showDeleteButton && deleteAction !== undefined && (
				<DeleteButtonWithModal
					deleteAction={deleteAction}
					id={id}
					title={title}
				/>
			)}
		</div>
	);
}
