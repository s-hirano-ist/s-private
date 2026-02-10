"use client";
import { Badge } from "@s-hirano-ist/s-ui/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@s-hirano-ist/s-ui/ui/card";
import type { ReactNode } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import { validateAndNormalizeUrl } from "@/components/common/utils/validate-url";
import { Link } from "@/infrastructures/i18n/routing";
import type { LinkCardData } from "./types";

const markdownComponents: Components = {
	img({ src, alt, ...props }) {
		if (!alt) {
			return (
				// biome-ignore lint/performance/noImgElement: Markdown images have dynamic external URLs
				// biome-ignore lint/a11y/noRedundantRoles: Explicit presentation role for screenreaders
				<img alt="" role="presentation" src={src} {...props} />
			);
		}
		// biome-ignore lint/performance/noImgElement: Markdown images have dynamic external URLs
		return <img alt={alt} src={src} {...props} />;
	},
};

type Props = {
	data: LinkCardData;
	actions?: ReactNode;
};

export function LinkCard({
	data: { title, description, primaryBadgeText, secondaryBadgeText, href },
	actions,
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
								<ReactMarkdown components={markdownComponents}>
									{description}
								</ReactMarkdown>
							) : (
								"　"
							)}
						</CardDescription>
					</CardContent>
				</Card>
			</CardComponent>
			{actions}
		</div>
	);
}
