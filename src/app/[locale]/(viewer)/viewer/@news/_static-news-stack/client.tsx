// import Image from "next/image";
// import defaultOgImage from "@/assets/defaultOgImage.jpg";

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
export const StaticNewsStackClient = ({ data }: Props) => {
	return (
		<article className=" mx-auto max-w-5xl" id="article" role="article">
			{data.map((d) => {
				return (
					<div
						className="overflow-hidden rounded px-2 py-1 shadow-lg sm:px-4"
						id={d.url}
						key={d.url}
					>
						<h2 className="text-xl">{d.title}</h2>
						<div>
							{d.quote}
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
								<div className="w-full py-4 sm:px-6">
									<div className="mb-2 text-xl font-bold">{d.ogTitle}</div>
									<p>{d.ogDescription}</p>
								</div>
							</div>
						</a>
					</div>
				);
			})}
		</article>
	);
};
