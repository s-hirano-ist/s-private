"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Route } from "next";
import { Link } from "next-view-transitions";
import Image, { type StaticImageData } from "next/image";

type Props = {
	path: string;
	slug: string;
	imagePath: string;
};

export function ContentPreview({ path, slug, imagePath }: Props) {
	// TODO: imageをblobから取ってくる
	// TODO: Image on errorの実装
	// FIXME: 相対パスの記述

	const imageSrc: StaticImageData =
		imagePath !== undefined
			? // eslint-disable-next-line @typescript-eslint/no-require-imports
				require(`../../../../s-contents/image/${path}/${imagePath}`)
			: // eslint-disable-next-line @typescript-eslint/no-require-imports
				require("../../../../s-contents/image/_no_image.svg");

	const href = `${path}/${slug}` as Route;

	return (
		<Link href={href}>
			<Card className="flex h-full flex-col justify-evenly">
				<CardHeader>
					<CardTitle className="text-center">{slug}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex justify-center">
						<Image
							src={imageSrc}
							height={96}
							width={96}
							alt={slug}
							className="h-auto w-full"
						/>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
