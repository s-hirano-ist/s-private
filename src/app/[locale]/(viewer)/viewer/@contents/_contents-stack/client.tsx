"use client";
import { LinkCardData } from "@/components/card/link-card";
import { LinkCardStack } from "@/components/card/link-card-stack";

type Props = { data: LinkCardData[] };

export function ContentsStackClient({ data }: Props) {
	return <LinkCardStack data={data} showDeleteButton={false} />;
}
