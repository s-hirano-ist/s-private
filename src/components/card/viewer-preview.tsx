"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { THUMBNAIL_HEIGHT, THUMBNAIL_WIDTH } from "@/constants";
import { convertUint8ArrayToImgSrc } from "@/features/viewer/utils/convert";
import { useNonce } from "@/nonce-provider";
import type { Route } from "next";
import { Link } from "next-view-transitions";
import NextImage from "next/image";

export type ImageType = "webp" | "svg";

export type Image = {
	title: string;
	uint8ArrayImage: Uint8Array;
};

type Props = {
	image: Image;
	path: string;
	imageType: ImageType;
};

export function ViewerPreview({ image, path, imageType }: Props) {
	const { title, uint8ArrayImage } = image;
	const href = `${path}/${title}` as Route;

	const src = convertUint8ArrayToImgSrc(uint8ArrayImage, imageType);

	const nonce = useNonce();

	return (
		// <Link href={href} nonce={nonce}>
		<Card className="flex h-full flex-col justify-evenly" nonce={nonce}>
			<CardHeader nonce={nonce}>
				<CardTitle className="text-center" nonce={nonce}>
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent nonce={nonce}>
				<div className="flex justify-center" nonce={nonce}>
					<NextImage
						src={src}
						height={THUMBNAIL_HEIGHT}
						width={THUMBNAIL_WIDTH}
						alt={title}
						nonce={nonce}
						className="h-auto w-full"
					/>
				</div>
			</CardContent>
		</Card>
		// </Link>
	);
}
