import { Route } from "next";
import NextImage from "next/image";
import { Link } from "next-view-transitions";
import { ViewerBodyClient } from "@/components/body/viewer-body";
import { NotFound } from "@/components/card/not-found";
import { Unauthorized } from "@/components/card/unauthorized";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { THUMBNAIL_HEIGHT, THUMBNAIL_WIDTH } from "@/constants";
import { hasViewerAdminPermission } from "@/features/auth/utils/session";
import prisma from "@/prisma";

type Props = { slug: string };

export async function ViewerBody({ slug }: Props) {
	const hasAdminPermission = await hasViewerAdminPermission();
	if (!hasAdminPermission) return <Unauthorized />;

	const data = await prisma.staticBooks.findUnique({
		where: { ISBN: slug },
		select: {
			markdown: true,
			googleTitle: true,
			googleSubTitle: true,
			googleDescription: true,
			googleAuthors: true,
			googleHref: true,
			googleImgSrc: true,
		},
		cacheStrategy: { ttl: 400, tags: ["staticBooks"] },
	});
	if (!data) return <NotFound />;

	return (
		<ViewerBodyClient markdown={data.markdown}>
			<Card className="grid grid-cols-4 gap-4 p-4">
				<div className="flex items-center justify-center">
					<NextImage
						alt={data.googleTitle}
						className="rounded bg-white p-1"
						height={THUMBNAIL_HEIGHT}
						src={data.googleImgSrc}
						width={THUMBNAIL_WIDTH}
					/>
				</div>
				<Link className="col-span-3" href={data.googleHref as Route}>
					<CardHeader>
						<CardTitle>
							{data.googleTitle} {data.googleSubTitle}
						</CardTitle>
						<CardDescription>{data.googleDescription}</CardDescription>
					</CardHeader>
					<CardContent>
						<p>Authors: {data.googleAuthors.join(", ")}</p>
					</CardContent>
				</Link>
			</Card>
		</ViewerBodyClient>
	);
}
