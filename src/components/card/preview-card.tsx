import type { Route } from "next";
import NextImage from "next/image";
import { Link } from "next-view-transitions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { THUMBNAIL_HEIGHT, THUMBNAIL_WIDTH } from "@/constants";
import { convertUint8ArrayToImgSrc } from "@/features/viewer/utils/convert";

export type ImageType = "webp" | "svg";

export type PreviewCardData = {
	href: string;
	title: string;
	uint8ArrayImage: Uint8Array;
};

type Props = {
	basePath: string;
	imageType: ImageType;
	previewCardData: PreviewCardData;
};

export function PreviewCard({ basePath, previewCardData, imageType }: Props) {
	const { title, href, uint8ArrayImage } = previewCardData;

	const src = convertUint8ArrayToImgSrc(uint8ArrayImage, imageType);

	return (
		<Link href={`${basePath}/${href}` as Route}>
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
