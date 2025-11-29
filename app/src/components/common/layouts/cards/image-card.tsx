"use client";
import { Card, CardContent, CardTitle } from "@s-hirano-ist/s-ui/ui/card";
import type { Route } from "next";
import NextImage from "next/image";
import type { DeleteAction } from "@/common/types";
import { DeleteButtonWithModal } from "@/components/common/forms/actions/delete-button-with-modal";
import { Link } from "@/infrastructures/i18n/routing";
import type { ImageCardData } from "./types";

type Props = {
	data: ImageCardData;
	basePath: string;
	showDeleteButton?: boolean;
	deleteAction?: DeleteAction;
};

export function ImageCard({
	basePath,
	data: { id, title, href, image },
	showDeleteButton = false,
	deleteAction,
}: Props) {
	return (
		<div className="relative h-full">
			<Link className="block h-full" href={`/${basePath}/${href}` as Route}>
				<Card className="flex h-full flex-col hover:bg-muted">
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
									width={192}
								/>
							)}
						</div>
					</CardContent>
				</Card>
			</Link>
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
