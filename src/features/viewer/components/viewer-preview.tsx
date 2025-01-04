import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Image, ImageType } from "@/features/viewer/types";
import { convertUint8ArrayToImgSrc } from "@/features/viewer/utils/convert";
import type { Route } from "next";
import { Link } from "next-view-transitions";
import NextImage from "next/image";

type Props = {
	image: Image;
	path: string;
	imageType: ImageType;
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
							src={src}
							height={96}
							width={96}
							alt={title}
							className="h-auto w-full"
						/>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
