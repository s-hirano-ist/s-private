import { ViewerBodyClient } from "@s-hirano-ist/s-ui/layouts/body/viewer-body";
import { Badge } from "@s-hirano-ist/s-ui/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@s-hirano-ist/s-ui/ui/card";
import { Rating } from "@s-hirano-ist/s-ui/ui/rating";
import { notFound } from "next/navigation";
import type { getBookByISBN } from "@/application-services/books/get-books";
import { BackButton } from "@/components/common/back-button";
import { ImageWithFallback } from "@/components/common/display/image/image-with-fallback";

export type Props = { slug: string; getBookByISBN: typeof getBookByISBN };

const statusVariant = {
	UNEXPORTED: "secondary",
	LAST_UPDATED: "outline",
	EXPORTED: "default",
} as const;

export async function ViewerBody({ slug, getBookByISBN }: Props) {
	const data = await getBookByISBN(slug);
	if (!data) notFound();

	const altText = data.title ?? "";
	const tags = data.tags as unknown as string[] | undefined;
	const authors = data.googleAuthors as unknown as string[] | null | undefined;

	return (
		<ViewerBodyClient markdown={data.markdown ?? ""}>
			<BackButton />
			<Card className="p-4">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
					<div className="flex flex-col items-center justify-center gap-2">
						<ImageWithFallback
							alt={altText}
							className="rounded bg-white p-1"
							height={192}
							src={data.googleImgSrc}
							width={192}
						/>
						{data.imagePath && (
							<ImageWithFallback
								alt={`${altText} (uploaded)`}
								className="rounded bg-white p-1"
								height={192}
								src={`/api/books/images/original/${data.imagePath}`}
								width={192}
							/>
						)}
					</div>
					<div className="md:col-span-3">
						<CardHeader>
							<CardTitle className="flex flex-col gap-1">
								<span>{data.title}</span>
								{data.googleSubTitle && (
									<span className="font-normal text-muted-foreground text-sm">
										{data.googleSubTitle}
									</span>
								)}
							</CardTitle>
							{data.googleDescription && (
								<CardDescription className="whitespace-pre-wrap">
									{data.googleDescription}
								</CardDescription>
							)}
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex items-center gap-2">
								<Rating rating={data.rating} />
								<span className="text-muted-foreground text-sm">
									({data.rating}/5)
								</span>
							</div>

							{authors && authors.length > 0 && (
								<p>Authors: {authors.join(", ")}</p>
							)}

							{tags && tags.length > 0 && (
								<div className="flex flex-wrap gap-1">
									{tags.map((tag) => (
										<Badge key={tag} variant="secondary">
											{tag}
										</Badge>
									))}
								</div>
							)}

							<div className="flex flex-wrap items-center gap-2">
								<Badge variant={statusVariant[data.status]}>
									{data.status}
								</Badge>
								{data.googleHref && (
									<a
										className="text-sm underline"
										href={data.googleHref}
										rel="noopener noreferrer"
										target="_blank"
									>
										Google Books
									</a>
								)}
							</div>

							<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t pt-3 text-muted-foreground text-xs">
								<dt>ISBN</dt>
								<dd>{data.isbn}</dd>
								<dt>Created</dt>
								<dd>
									{(data.createdAt as unknown as Date).toLocaleDateString()}
								</dd>
								{data.status === "EXPORTED" && (
									<>
										<dt>Exported</dt>
										<dd>
											{(
												data.exportedAt as unknown as Date
											).toLocaleDateString()}
										</dd>
									</>
								)}
							</dl>
						</CardContent>
					</div>
				</div>
			</Card>
		</ViewerBodyClient>
	);
}
