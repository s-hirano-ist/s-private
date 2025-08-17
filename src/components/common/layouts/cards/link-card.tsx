"use client";
import ReactMarkdown from "react-markdown";
import { ServerAction } from "@/common/types";
import { DeleteButtonWithModal } from "@/components/common/forms/actions/delete-button-with-modal";
import { Badge } from "@/components/common/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/common/ui/card";
import { validateAndNormalizeUrl } from "@/components/common/utils/validate-url";
import { Link } from "@/infrastructures/i18n/routing";

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
		<div className="relative h-full">
			<CardComponent {...linkProps} className="block h-full">
				<Card className="hover:bg-secondary h-full flex flex-col">
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
