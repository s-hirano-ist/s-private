import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { THUMBNAIL_HEIGHT, THUMBNAIL_WIDTH } from "@/constants";
import { convertUint8ArrayToImgSrc } from "@/features/viewer/utils/convert";
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
	imageType: ImageType;
	path: string;
};

export function ViewerPreview({ image, path, imageType }: Props) {
	const { title, uint8ArrayImage } = image;
	const href = `${path}/${title}` as Route;

	const src = convertUint8ArrayToImgSrc(uint8ArrayImage, imageType);

	return (
		<Link href={href}>
			<Card className="flex h-full flex-col justify-evenly">
				<CardHeader>
					<CardTitle className="text-center">{title}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex justify-center">
						<NextImage
							alt={title}
							className="h-auto w-full rounded bg-white p-1"
							height={THUMBNAIL_HEIGHT}
							src={src}
							width={THUMBNAIL_WIDTH}
						/>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
