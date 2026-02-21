"use client";
import { Card, CardContent, CardTitle } from "@s-hirano-ist/s-ui/ui/card";
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
	data: { title, href, image },
	actions,
}: Props) {
	return (
		<div className="relative h-full">
			<Link className="block h-full" href={`/${basePath}/${href}` as Route}>
				<Card className="flex h-full flex-col hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
					<CardContent className="flex flex-grow flex-col justify-center">
						<div className="flex justify-center">
							{image === null || image.includes("notFound.png") ? (
								<CardTitle className="text-center">{title}</CardTitle>
							) : (
								<NextImage
									alt={title}
									className="h-auto w-full rounded bg-white p-1"
									height={192}
									src={image}
									unoptimized
									width={192}
								/>
							)}
						</div>
					</CardContent>
				</Card>
			</Link>
			{actions}
		</div>
	);
}
