// import Image from "next/image";
// import defaultOgImage from "@/assets/defaultOgImage.jpg";

import { LinkCard } from "@/components/card/link-card";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

type Props = {
	data: {
		id: number;
		ogDescription: string | null;
		ogImageUrl: string | null;
		ogTitle: string | null;
		quote: string | null;
		title: string;
		url: string;
	}[];
};
export const NewsStackClient = ({ data }: Props) => {
	return (
		<article className=" mx-auto max-w-5xl" id="article" role="article">
			<div className="m-2 space-y-4">
				{data.map((d) => {
					return (
						<>
							<LinkCard
								data={{
									id: d.id,
									badgeText: d.title,
									title: d.title,
									href: d.url,
								}}
								showDeleteButton={false}
							/>
							<Card id={d.url} key={d.url}>
								<CardHeader>
									<CardTitle className="text-primary-grad">{d.title}</CardTitle>
									<CardDescription>{d.quote}</CardDescription>
								</CardHeader>
								<CardContent>
									<div>
										{/* TODO: change to use fragment */}
										{/* <Fragment set:html={sanitizeHtml(d.quote ?? "")} /> */}
									</div>
									<a href={d.url} rel="noopener noreferrer" target="_blank">
										<div className="flex w-full justify-start">
											{/* TODO: show images */}
											{/* {d.ogImageUrl === null ? (
									<Image
										alt=""
										className="hidden size-32 object-cover sm:block"
										src={defaultOgImage}
									/>
								) : (
									// width and height is overwritten by tailwind class
									<Image
										alt=""
										className="hidden size-32 object-cover sm:block"
										height="128"
										src={d.ogImageUrl}
										width="128"
									/>
								)} */}
											<div className="w-full p-4">
												<CardTitle className="break-words">
													{d.ogTitle}
												</CardTitle>
												<CardDescription className="break-words">
													{d.ogDescription}
												</CardDescription>
											</div>
										</div>
									</a>
								</CardContent>
							</Card>
						</>
					);
				})}
			</div>
		</article>
	);
};
