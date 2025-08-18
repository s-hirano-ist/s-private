"use client";
import type { Route } from "next";
import NextImage from "next/image";
import type { ServerAction } from "@/common/types";
import { DeleteButtonWithModal } from "@/components/common/forms/actions/delete-button-with-modal";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/common/ui/card";
import { Link } from "@/infrastructures/i18n/routing";
import type { ImageCardData } from "./types";

type Props = {
	data: ImageCardData;
	basePath: string;
	showDeleteButton?: boolean;
	deleteAction?: (id: string) => Promise<ServerAction>;
};

export function ImageCard({
	basePath,
	data: { id, title, href, image },
	showDeleteButton = false,
	deleteAction,
}: Props) {
	return (
		<div className="relative">
			<Link className="block" href={`/${basePath}/${href}` as Route}>
				<Card className="flex h-full flex-col justify-evenly hover:bg-secondary">
					<CardHeader>
						<CardTitle className="text-center">{title}</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex justify-center">
							<NextImage
								alt={title}
								className="h-auto w-full rounded bg-white p-1"
								height={192}
								src={image}
								width={192}
							/>
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
