import { LinkCard, LinkCardData } from "@/components/card/link-card";

type Props = { data: LinkCardData[] };

export const NewsStackClient = ({ data }: Props) => {
	return (
		<article className=" mx-auto max-w-5xl" id="article" role="article">
			<div className="m-2 space-y-4">
				{data.map((d) => {
					return <LinkCard data={d} key={d.id} showDeleteButton={false} />;
				})}
			</div>
		</article>
	);
};
