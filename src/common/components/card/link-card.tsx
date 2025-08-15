"use client";
import ReactMarkdown from "react-markdown";
import { DeleteButtonWithModal } from "@/common/components/delete-button-with-modal";
import { Badge } from "@/common/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/common/components/ui/card";
import { ServerAction } from "@/common/types";
import { validateAndNormalizeUrl } from "@/common/validate/validate-url";
import { Link } from "@/i18n/routing";

export type LinkCardData = {
	id: string;
	key: string;
	title: string;
	description?: string;
	primaryBadgeText?: string;
	secondaryBadgeText?: string;
	href: string;
};

type Props = {
	data: LinkCardData;
	showDeleteButton: boolean;
	deleteAction?: (id: string) => Promise<ServerAction>;
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
		<div className="relative">
			<CardComponent {...linkProps} className="block">
				<Card className="hover:bg-secondary">
					<CardHeader>
						<div className="flex gap-4">
							{primaryBadgeText && <Badge>{primaryBadgeText}</Badge>}
							{secondaryBadgeText && (
								<Badge variant="outline">{secondaryBadgeText}</Badge>
							)}
						</div>
					</CardHeader>
					<CardContent>
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
