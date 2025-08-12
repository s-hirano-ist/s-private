"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { ImageCard, ImageCardData } from "@/components/card/image-card";
import { Input } from "@/components/ui/input";

const PARAM_NAME = "q";

type Props = {
	basePath: string;
	data: ImageCardData[];
};

export function ImageCardStack({ data, basePath }: Props) {
	// TODO: use queryを利用してデータのキャッシュを行う
	// TODO: FIXME: search layoutとして分離

	const router = useRouter();
	const searchParams = useSearchParams();
	const [searchTerm, setSearchTerm] = useState(
		searchParams.get(PARAM_NAME) ?? "",
	);
	const [searchResults, setSearchResults] = useState(data);

	const fetchSearchResults = useCallback(
		async (searchString: string) => {
			if (searchString === "") setSearchResults(data);
			else
				setSearchResults(
					data.filter((image) => image.title.includes(searchString)),
				);
		},
		[data],
	);

	const debouncedSearch = useDebouncedCallback(async (searchString: string) => {
		const params = new URLSearchParams(searchParams);
		if (searchString) params.set(PARAM_NAME, searchString);
		else params.delete(PARAM_NAME);

		router.push(`?${params.toString()}`);
		await fetchSearchResults(searchString);
	}, 300);

	const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const term = e.target.value;
		setSearchTerm(term);
		await debouncedSearch(term);
	};

	const t = useTranslations("label");

	return (
		<div className="px-2">
			<Input
				className="my-4"
				onChange={handleSearchChange}
				placeholder={t("search")}
				type="q"
				value={searchTerm}
			/>
			<div className="my-2 grid grid-cols-2 items-stretch gap-4 sm:grid-cols-3 lg:grid-cols-4">
				{searchResults.map((searchResult) => {
					return (
						<ImageCard
							basePath={basePath}
							data={searchResult}
							key={searchResult.title}
						/>
					);
				})}
			</div>
		</div>
	);
}
