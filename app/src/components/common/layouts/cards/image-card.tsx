"use client";
import {
	Card,
	CardContent,
	CardDescription,
	CardTitle,
} from "@s-hirano-ist/s-ui/ui/card";
import type { Route } from "next";
import NextImage from "next/image";
import type { ReactNode } from "react";
import { Link } from "@/infrastructures/i18n/routing";
import type { ImageCardData } from "./types";

type Props = {
	data: ImageCardData;
	basePath: string;
	actions?: ReactNode;
};

export function ImageCard({
	basePath,
	data: { title, href, image, authors, subtitle },
	actions,
}: Props) {
	const hasImage = image !== null && !image.includes("notFound.png");

	return (
		<div className="relative h-full">
			<Link className="block h-full" href={`/${basePath}/${href}` as Route}>
				<Card className="flex h-full flex-col border-l-3 border-l-primary/40 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
					<CardContent className="flex flex-grow flex-col">
						<div className="flex justify-center py-2">
							{hasImage ? (
								<NextImage
									alt={title}
									className="h-auto max-h-48 w-auto rounded bg-white object-contain p-1"
									height={192}
									src={image}
									unoptimized
									width={192}
								/>
							) : (
								<div className="flex h-48 items-center justify-center">
									<CardTitle className="text-center">{title}</CardTitle>
								</div>
							)}
						</div>
						{hasImage && (
							<CardTitle className="line-clamp-2 text-sm">{title}</CardTitle>
						)}
						{(subtitle || authors) && (
							<CardDescription className="mt-1 line-clamp-2 text-xs">
								{authors}
								{subtitle && authors && " - "}
								{subtitle}
							</CardDescription>
						)}
					</CardContent>
				</Card>
			</Link>
			{actions}
		</div>
	);
}
