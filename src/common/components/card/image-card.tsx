import type { Route } from "next";
import NextImage from "next/image";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/common/components/ui/card";
import { Link } from "@/i18n/routing";

export type ImageCardData = {
	href: string;
	title: string;
	image: string;
};

type Props = {
	data: ImageCardData;
	basePath: string;
};

export function ImageCard({ basePath, data: { title, href, image } }: Props) {
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
							height={192}
							src={image}
							width={192}
						/>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
